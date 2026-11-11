"""Pruebas de sistema de MAKINA con Selenium (CP-01 a CP-28).

Se ejecutan contra una instancia con el esquema y el seed cargados
(supabase/migrations/001_esquema.sql y supabase/seed.sql). NO las ejecutes
contra producción: crean, modifican y eliminan registros.

Uso rápido (ver tests/e2e/README.md):
    node tests/e2e/bd_local.mjs                       # base local desechable
    PORT=3002 DATABASE_URL=postgres://postgres:postgres@localhost:5544/postgres node index.js --dev
    python tests/e2e/ejecutar_pruebas.py              # corre todo y genera el PDF

Variables opcionales:
    MAKINA_URL       URL base (por defecto http://localhost:3000)
    MAKINA_USUARIO   usuario de prueba (por defecto admin, del seed)
    MAKINA_CLAVE     contraseña de prueba (por defecto la del seed)
    MAKINA_HEADLESS  "0" para ver el navegador
    MAKINA_CHROMEDRIVER  ruta a un chromedriver concreto (si no, Selenium Manager lo resuelve)
"""

import datetime
import functools
import json
import os
import time
import unittest
from pathlib import Path

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select, WebDriverWait

BASE = os.environ.get("MAKINA_URL", "http://localhost:3000").rstrip("/")
USUARIO = os.environ.get("MAKINA_USUARIO", "admin")
CLAVE = os.environ.get("MAKINA_CLAVE", "Makina2026!")
EVIDENCIAS = Path(__file__).parent / "evidencias"
EVIDENCIAS.mkdir(exist_ok=True)

# Capturas tomadas por cada caso (las usa el reporte PDF)
CAPTURAS = {}


def caso(codigo, titulo, requisito, objetivo, esperado):
    """Ficha del caso de prueba que aparece en el reporte PDF."""

    def decorar(funcion):
        @functools.wraps(funcion)
        def envoltura(self, *args, **kwargs):
            try:
                return funcion(self, *args, **kwargs)
            except unittest.SkipTest:
                raise
            except Exception:
                # Guarda cómo quedó la pantalla cuando el caso falla
                try:
                    self.evidencia(f"{codigo.split(' ')[0]}_fallo")
                except Exception:  # noqa: BLE001 - el navegador pudo haberse cerrado
                    pass
                raise

        envoltura.caso = {
            "codigo": codigo,
            "titulo": titulo,
            "requisito": requisito,
            "objetivo": objetivo,
            "esperado": esperado,
        }
        return envoltura

    return decorar


def crear_driver(ancho=1366, alto=860):
    opciones = webdriver.ChromeOptions()
    if os.environ.get("MAKINA_HEADLESS", "1") != "0":
        opciones.add_argument("--headless=new")
    opciones.add_argument("--no-sandbox")
    opciones.add_argument("--disable-dev-shm-usage")
    opciones.add_argument(f"--window-size={ancho},{alto}")
    opciones.add_argument("--lang=es-CO")
    driver_path = os.environ.get("MAKINA_CHROMEDRIVER")
    servicio = Service(driver_path) if driver_path else Service()
    return webdriver.Chrome(options=opciones, service=servicio)


def moneda_compacta(valor):
    """Mismo formato que formatearMoneda() del frontend."""
    if not valor:
        return "$0"
    if valor >= 1_000_000:
        return f"${valor / 1_000_000:.1f}M"
    if valor >= 1000:
        return f"${round(valor / 1000)}K"
    return f"${valor}"


def hoy():
    return datetime.date.today().isoformat()


class PruebasMakina(unittest.TestCase):
    """Cada prueba abre su propio navegador; las que necesitan sesión inician sesión."""

    def setUp(self):
        self.driver = crear_driver()
        self.espera = WebDriverWait(self.driver, 15)

    def tearDown(self):
        self.driver.quit()

    # ----------------------------------------------------------- utilidades
    def evidencia(self, nombre):
        ruta = EVIDENCIAS / f"{nombre}.png"
        self.driver.save_screenshot(str(ruta))
        codigo = getattr(getattr(self, self._testMethodName), "caso", {}).get("codigo", nombre)
        CAPTURAS.setdefault(codigo, []).append(ruta)

    def abrir(self, ruta):
        self.driver.get(BASE + ruta)

    def iniciar_sesion(self, usuario=USUARIO, clave=CLAVE):
        self.abrir("/login")
        campo = self.espera.until(EC.visibility_of_element_located((By.ID, "identificador")))
        campo.clear()
        campo.send_keys(usuario)
        self.driver.find_element(By.ID, "contrasena").send_keys(clave)
        self.driver.find_element(By.CSS_SELECTOR, "form button[type=submit]").click()

    def entrar(self):
        self.iniciar_sesion()
        self.esperar_url("/home")
        self.espera.until(EC.visibility_of_element_located((By.CSS_SELECTOR, ".sidebar")))

    def api(self, metodo, ruta, cuerpo=None):
        """Llama a la API desde el navegador, con la cookie de sesión de Selenium."""
        return self.driver.execute_async_script(
            """
            const [metodo, ruta, cuerpo, listo] = arguments;
            fetch('/api' + ruta, {
              method: metodo,
              credentials: 'include',
              headers: cuerpo ? {'Content-Type': 'application/json'} : {},
              body: cuerpo ? JSON.stringify(cuerpo) : undefined,
            }).then(async (r) => {
              const texto = await r.text();
              let datos = null;
              try { datos = texto ? JSON.parse(texto) : null; } catch (e) {}
              listo({status: r.status, datos});
            }).catch((e) => listo({status: 0, datos: String(e)}));
            """,
            metodo, ruta, cuerpo,
        )

    def clic(self, elemento):
        """Lleva el elemento al centro de la vista antes de hacer clic."""
        self.driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", elemento)
        time.sleep(0.3)
        elemento.click()

    def esperar_url(self, fragmento):
        self.espera.until(EC.url_contains(fragmento))

    def esperar_texto(self, texto, selector="main"):
        self.espera.until(EC.text_to_be_present_in_element((By.CSS_SELECTOR, selector), texto))

    def fijar_valor(self, elemento, valor):
        """Escribe en un input controlado por React (útil para fechas)."""
        self.driver.execute_script(
            "const i=arguments[0]; const proto=i.tagName==='TEXTAREA'?HTMLTextAreaElement:HTMLInputElement;"
            "Object.getOwnPropertyDescriptor(proto.prototype,'value').set.call(i, arguments[1]);"
            "i.dispatchEvent(new Event('input',{bubbles:true}));"
            "i.dispatchEvent(new Event('change',{bubbles:true}));",
            elemento, valor,
        )

    def dialogo_abierto(self):
        return self.espera.until(
            EC.visibility_of_element_located((By.CSS_SELECTOR, "dialog.admin-dialogo[open]"))
        )

    def assertCampoInvalido(self, campo):
        """El navegador marca el campo como inválido y muestra su mensaje (p. ej. 'Completa este campo')."""
        valido, mensaje = self.driver.execute_script(
            "return [arguments[0].checkValidity(), arguments[0].validationMessage];", campo)
        self.assertFalse(valido, "El campo debía quedar inválido")
        self.assertTrue(mensaje, "El navegador no mostró mensaje de validación")

    def titulo_pagina(self):
        return self.espera.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "main h1"))).text

    # ------------------------------------------------- acceso y seguridad
    @caso("CP-01", "Inicio de sesión correcto", "RF-01",
          "Ingresar con el usuario administrador del seed.",
          "Redirige al panel /home y muestra el menú lateral.")
    def test_cp01_login_correcto(self):
        self.entrar()
        self.assertTrue(self.driver.current_url.endswith("/home"))
        self.evidencia("CP-01_login_correcto")

    @caso("CP-02", "Inicio de sesión con contraseña errónea", "RF-01",
          "Intentar entrar con una contraseña incorrecta.",
          "Se muestra un aviso de datos incorrectos, se queda en /login y la API responde 401.")
    def test_cp02_login_incorrecto(self):
        self.iniciar_sesion(clave="claveIncorrecta123")
        alerta = self.espera.until(
            EC.visibility_of_element_located((By.CSS_SELECTOR, ".login-error[role=alert]"))
        )
        self.assertIn("incorrectos", alerta.text)
        self.assertIn("/login", self.driver.current_url)
        self.evidencia("CP-02_login_incorrecto")
        r = self.api("POST", "/auth/login", {"identificador": USUARIO, "contrasena": "claveIncorrecta123"})
        self.assertEqual(r["status"], 401)

    @caso("CP-03", "Acceso al panel sin sesión", "RNF Seguridad",
          "Abrir /home sin haber iniciado sesión.",
          "El sistema redirige a /login.")
    def test_cp03_home_sin_sesion(self):
        self.abrir("/home")
        self.esperar_url("/login")
        self.assertIn("/login", self.driver.current_url)

    @caso("CP-12", "Cerrar sesión", "RF-01",
          "Cerrar sesión desde el menú de usuario de la barra superior.",
          "Vuelve a /login y el panel deja de ser accesible.")
    def test_cp12_cerrar_sesion(self):
        self.entrar()
        self.clic(self.driver.find_element(By.CSS_SELECTOR, "button[aria-label='Menú de usuario']"))
        opcion = self.espera.until(
            EC.element_to_be_clickable((By.XPATH, "//button[@role='menuitem'][contains(., 'Cerrar sesión')]"))
        )
        opcion.click()
        self.esperar_url("/login")
        self.assertEqual(self.api("GET", "/auth/me")["status"], 401)
        self.abrir("/home")
        self.esperar_url("/login")
        self.evidencia("CP-12_sesion_cerrada")

    @caso("CP-13", "API protegida sin sesión", "RNF Seguridad",
          "Consultar los endpoints privados de la API sin cookie de sesión.",
          "Todos responden 401; la tarifa pública sí responde 200.")
    def test_cp13_api_sin_sesion(self):
        self.abrir("/login")
        for ruta in ["/maquinas", "/operadores", "/clientes", "/movimientos", "/solicitudes", "/asignaciones"]:
            with self.subTest(ruta=ruta):
                self.assertEqual(self.api("GET", ruta)["status"], 401, ruta)
        self.assertEqual(self.api("GET", "/publico/tarifas")["status"], 200)

    # ------------------------------------------------------------ máquinas
    @caso("CP-04", "Máquina con placa repetida", "RF-02",
          "Registrar desde el formulario una máquina con la placa 387J, que ya existe.",
          "El formulario muestra 'Ya existe' y la API responde 409.")
    def test_cp04_maquina_placa_repetida(self):
        self.entrar()
        self.abrir("/maquinaria")
        self.espera.until(
            EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Nueva máquina')]"))
        ).click()
        dialogo = self.dialogo_abierto()
        Select(dialogo.find_element(By.NAME, "tipo")).select_by_value("Pajarita")
        dialogo.find_element(By.NAME, "placa").send_keys("387J")
        dialogo.find_element(By.NAME, "valor_hora").send_keys("90000")
        dialogo.find_element(By.XPATH, ".//button[contains(., 'Registrar máquina')]").click()
        error = self.espera.until(
            EC.visibility_of_element_located((By.CSS_SELECTOR, "dialog[open] .form-error"))
        )
        self.assertIn("Ya existe", error.text)
        self.evidencia("CP-04_placa_repetida")
        r = self.api("POST", "/maquinas", {"tipo": "Pajarita", "placa": "387J", "valor_hora": 90000})
        self.assertEqual(r["status"], 409)

    @caso("CP-05", "Eliminar máquina con ingresos", "RF-02 / RNF Confiabilidad",
          "Intentar eliminar la máquina 1, que tiene ingresos registrados.",
          "La API responde 409 y la máquina sigue existiendo.")
    def test_cp05_eliminar_maquina_con_ingresos(self):
        self.entrar()
        r = self.api("DELETE", "/maquinas/1")
        self.assertEqual(r["status"], 409)
        self.assertEqual(self.api("GET", "/maquinas/1")["status"], 200)

    @caso("CP-14", "Registrar, editar y eliminar una máquina", "RF-02",
          "Crear una máquina desde 'Nueva máquina', cambiar su valor por hora y eliminarla.",
          "La máquina aparece en el listado, se actualiza y desaparece al eliminarla.")
    def test_cp14_crud_maquina_por_interfaz(self):
        self.entrar()
        placa = f"T{int(time.time()) % 100000}"
        self.abrir("/maquinaria")
        self.espera.until(
            EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Nueva máquina')]"))
        ).click()
        dialogo = self.dialogo_abierto()
        Select(dialogo.find_element(By.NAME, "tipo")).select_by_value("Bulldozer")
        dialogo.find_element(By.NAME, "placa").send_keys(placa)
        dialogo.find_element(By.NAME, "valor_hora").send_keys("110000")
        dialogo.find_element(By.XPATH, ".//button[contains(., 'Registrar máquina')]").click()
        self.esperar_texto(placa)
        self.evidencia("CP-14_maquina_creada")

        # Editar
        self.clic(self.driver.find_element(
            By.XPATH, f"//button[starts-with(@aria-label, 'Editar') and contains(@aria-label, '{placa}')]"))
        dialogo = self.dialogo_abierto()
        campo = dialogo.find_element(By.NAME, "valor_hora")
        campo.send_keys(Keys.CONTROL, "a")
        campo.send_keys("125000")
        dialogo.find_element(By.XPATH, ".//button[contains(., 'Guardar cambios')]").click()
        self.espera.until(EC.invisibility_of_element_located((By.CSS_SELECTOR, "dialog.admin-dialogo[open]")))
        maquina = next(m for m in self.api("GET", "/maquinas")["datos"] if m["placa"] == placa)
        self.assertEqual(float(maquina["valor_hora"]), 125000)

        # Eliminar
        self.clic(self.driver.find_element(
            By.XPATH, f"//button[starts-with(@aria-label, 'Eliminar') and contains(@aria-label, '{placa}')]"))
        dialogo = self.dialogo_abierto()
        dialogo.find_element(By.XPATH, ".//button[normalize-space()='Eliminar']").click()
        self.espera.until(EC.invisibility_of_element_located((By.CSS_SELECTOR, "dialog.admin-dialogo[open]")))
        self.assertEqual(self.api("GET", f"/maquinas/{maquina['id_maquina']}")["status"], 404)
        self.assertIn(f"{placa} fue eliminada", self.driver.find_element(By.TAG_NAME, "main").text)
        self.assertNotIn(f"Placa {placa}", self.driver.find_element(By.TAG_NAME, "main").text)

    @caso("CP-16", "Detalle de máquina", "RF-08",
          "Abrir el detalle de la máquina 387J.",
          "Muestra la placa, el operador actual, el historial y los registros del equipo.")
    def test_cp16_detalle_maquina(self):
        self.entrar()
        self.abrir("/maquinaria/387J")
        self.esperar_texto("387J")
        texto = self.driver.find_element(By.TAG_NAME, "main").text
        for fragmento in ["Operador actual", "Asignar operador" if "Sin operador" in texto else "Cambiar operador"]:
            self.assertIn(fragmento, texto)
        self.evidencia("CP-16_detalle_maquina")

    @caso("CP-27", "Máquina inexistente", "RF-08",
          "Abrir el detalle de una placa que no existe.",
          "Se muestra el aviso 'Máquina no encontrada' en lugar de un error.")
    def test_cp27_maquina_inexistente(self):
        self.entrar()
        self.abrir("/maquinaria/NOEXISTE")
        self.esperar_texto("Máquina no encontrada")

    # ---------------------------------------------- operadores y clientes
    @caso("CP-06", "CRUD de operadores y clientes", "RF-03 / RF-09",
          "Crear, editar y eliminar un operador y un cliente.",
          "Cada cambio se refleja en su listado.")
    def test_cp06_crud_operadores_y_clientes(self):
        self.entrar()
        marca = str(int(time.time()))

        # Operadores
        r = self.api("POST", "/operadores", {"nombre": "Prueba", "apellido": f"Selenium{marca}",
                                              "cedula": f"9{marca}", "sueldo": 2000000})
        self.assertEqual(r["status"], 201)
        id_op = r["datos"]["id_operador"]
        self.abrir("/operadores")
        self.esperar_texto(f"Selenium{marca}")
        r = self.api("PUT", f"/operadores/{id_op}", {"apellido": f"Editado{marca}"})
        self.assertEqual(r["status"], 200)
        self.driver.refresh()
        self.esperar_texto(f"Editado{marca}")
        self.assertEqual(self.api("DELETE", f"/operadores/{id_op}")["status"], 204)
        self.driver.refresh()
        self.espera.until(EC.visibility_of_element_located((By.TAG_NAME, "main")))
        self.assertNotIn(f"Editado{marca}", self.driver.find_element(By.TAG_NAME, "main").text)

        # Clientes (alta desde el formulario)
        self.abrir("/clientes")
        self.espera.until(
            EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Nuevo cliente')]"))
        ).click()
        dialogo = self.dialogo_abierto()
        dialogo.find_element(By.NAME, "nombre_obra").send_keys(f"Obra Selenium {marca}")
        dialogo.find_element(By.NAME, "telefono").send_keys("3001112233")
        dialogo.find_element(By.XPATH, ".//button[contains(., 'Registrar cliente')]").click()
        self.esperar_texto(f"Obra Selenium {marca}")
        self.evidencia("CP-06_cliente_creado")
        id_cl = next(c["id_cliente"] for c in self.api("GET", "/clientes")["datos"]
                     if c["nombre_obra"] == f"Obra Selenium {marca}")
        self.assertEqual(self.api("PUT", f"/clientes/{id_cl}", {"nombre_obra": f"Obra Editada {marca}"})["status"], 200)
        self.driver.refresh()
        self.esperar_texto(f"Obra Editada {marca}")
        self.assertEqual(self.api("DELETE", f"/clientes/{id_cl}")["status"], 204)
        self.driver.refresh()
        self.espera.until(EC.visibility_of_element_located((By.TAG_NAME, "main")))
        self.assertNotIn(f"Obra Editada {marca}", self.driver.find_element(By.TAG_NAME, "main").text)

    @caso("CP-07", "Asignar operador a máquina ocupada", "RF-03",
          "Asignar un operador libre a la máquina 1, que ya tiene operador.",
          "La asignación anterior se cierra con la fecha de hoy y la nueva queda vigente.")
    def test_cp07_asignar_operador_a_maquina_ocupada(self):
        self.entrar()
        abiertas = [a for a in self.api("GET", "/asignaciones")["datos"] if a["fecha_salida"] is None]
        ocupada = next(a for a in abiertas if a["id_maquina"] == 1)
        ocupados = {a["id_operador"] for a in abiertas}
        libres = [o["id_operador"] for o in self.api("GET", "/operadores")["datos"]
                  if o["id_operador"] not in ocupados]
        self.assertTrue(libres, "Se necesita un operador libre en los datos de prueba")
        r = self.api("POST", "/asignaciones", {"id_maquina": 1, "id_operador": libres[0], "fecha_ingreso": hoy()})
        self.assertEqual(r["status"], 201, r)
        self.assertEqual(r["datos"]["asignacion"]["fecha_salida"], None)
        cerradas = {c["id"]: c for c in r["datos"]["cerradas"]}
        self.assertIn(ocupada["id"], cerradas)
        self.assertEqual(cerradas[ocupada["id"]]["fecha_salida"], hoy())

    @caso("CP-17", "Retiro de operador (cerrar asignación)", "RF-04",
          "Cerrar desde el detalle de la máquina 387J la asignación vigente.",
          "La máquina queda 'Sin operador' y la asignación conserva su fecha de salida (no se borra).")
    def test_cp17_retiro_de_operador(self):
        self.entrar()
        self.abrir("/maquinaria/387J")
        self.clic(self.espera.until(
            EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Cerrar asignación')]"))))
        dialogo = self.dialogo_abierto()
        self.fijar_valor(dialogo.find_element(By.CSS_SELECTOR, "input[type=date]"), hoy())
        dialogo.find_element(By.XPATH, ".//button[contains(., 'Cerrar asignación')]").click()
        self.espera.until(EC.invisibility_of_element_located((By.CSS_SELECTOR, "dialog.admin-dialogo[open]")))
        self.esperar_texto("Asignar operador")
        historial = [a for a in self.api("GET", "/asignaciones")["datos"] if a["id_maquina"] == 1]
        self.assertTrue(all(a["fecha_salida"] for a in historial), historial)
        self.assertTrue(any(a["fecha_salida"] == hoy() for a in historial))
        self.evidencia("CP-17_operador_retirado")

    @caso("CP-18", "Asignar operador desde la interfaz", "RF-03",
          "Con la máquina 387J libre, asignarle un operador libre desde 'Asignar operador'.",
          "El detalle muestra al operador y la API tiene la asignación vigente.")
    def test_cp18_asignar_operador_por_interfaz(self):
        self.entrar()
        abiertas = [a for a in self.api("GET", "/asignaciones")["datos"] if a["fecha_salida"] is None]
        if any(a["id_maquina"] == 1 for a in abiertas):
            self.skipTest("La máquina 387J ya tiene operador (ejecuta antes CP-17)")
        ocupados = {a["id_operador"] for a in abiertas}
        libre = next(o for o in self.api("GET", "/operadores")["datos"] if o["id_operador"] not in ocupados)
        self.abrir("/maquinaria/387J")
        self.clic(self.espera.until(
            EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Asignar operador')]"))))
        dialogo = self.dialogo_abierto()
        Select(dialogo.find_element(By.TAG_NAME, "select")).select_by_value(str(libre["id_operador"]))
        self.fijar_valor(dialogo.find_element(By.CSS_SELECTOR, "input[type=date]"), hoy())
        dialogo.find_element(By.XPATH, ".//button[normalize-space()='Asignar']").click()
        self.espera.until(EC.invisibility_of_element_located((By.CSS_SELECTOR, "dialog.admin-dialogo[open]")))
        self.esperar_texto("Cambiar operador")
        self.assertIn(libre["apellido"], self.driver.find_element(By.TAG_NAME, "main").text)
        vigente = [a for a in self.api("GET", "/asignaciones")["datos"]
                   if a["id_maquina"] == 1 and a["fecha_salida"] is None]
        self.assertEqual([a["id_operador"] for a in vigente], [libre["id_operador"]])
        self.evidencia("CP-18_operador_asignado")

    @caso("CP-19", "Detalle de operador", "RF-03",
          "Abrir el detalle del operador 1.",
          "Muestra su nombre, su máquina actual y su historial de asignaciones.")
    def test_cp19_detalle_operador(self):
        self.entrar()
        operador = self.api("GET", "/operadores/1")["datos"]
        self.abrir("/operador/1")
        self.esperar_texto(operador["apellido"])
        self.assertIn("Historial", self.driver.find_element(By.TAG_NAME, "main").text)
        self.evidencia("CP-19_detalle_operador")

    # ------------------------------------------------------------ finanzas
    @caso("CP-08", "Ingreso sin cliente", "RF-05",
          "Enviar a la API un ingreso sin cliente asociado.",
          "La API responde 400 indicando el campo id_cliente.")
    def test_cp08_ingreso_sin_cliente(self):
        self.entrar()
        r = self.api("POST", "/movimientos", {"tipo": "ingreso", "id_maquina": 1, "valor": 100000,
                                               "horas": 2, "fecha": hoy()})
        self.assertEqual(r["status"], 400)
        self.assertIn("id_cliente", r["datos"]["detalles"])

    @caso("CP-20", "Registrar un ingreso desde el formulario", "RF-05",
          "Registrar 5 horas de la máquina 786H ($120.000/h) usando el valor sugerido, y luego eliminarlo.",
          "Sin horas no deja enviar; se sugiere $600K (horas x valor/hora), se guarda y se puede eliminar.")
    def test_cp20_registrar_ingreso(self):
        self.entrar()
        self.abrir("/movimientos")
        form = self.espera.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "form.mov-form")))
        form.find_element(By.XPATH, ".//button[@aria-pressed][contains(., 'Ingreso')]").click()

        # Validación: sin horas no deja guardar
        self.fijar_valor(form.find_element(By.NAME, "fecha"), hoy())
        Select(form.find_element(By.NAME, "id_maquina")).select_by_value("2")
        Select(form.find_element(By.NAME, "id_cliente")).select_by_value("1")
        self.clic(form.find_element(By.CSS_SELECTOR, "button[type=submit]"))
        self.assertCampoInvalido(form.find_element(By.NAME, "horas"))
        self.assertEqual(form.find_elements(By.CSS_SELECTOR, ".mov-aviso"), [])

        form.find_element(By.NAME, "horas").send_keys("5")
        sugerido = self.espera.until(EC.element_to_be_clickable((By.CSS_SELECTOR, ".mov-ayuda-btn")))
        self.assertIn("$600K", sugerido.text)
        self.clic(sugerido)
        self.assertEqual(form.find_element(By.NAME, "valor").get_attribute("value"), "600000")
        marca = f"Ingreso Selenium {int(time.time())}"
        form.find_element(By.NAME, "descripcion").send_keys(marca)
        self.clic(form.find_element(By.CSS_SELECTOR, "button[type=submit]"))
        aviso = self.espera.until(EC.visibility_of_element_located((By.CSS_SELECTOR, ".mov-aviso[role=status]")))
        self.assertIn("Ingreso registrado", aviso.text)
        self.assertIn("600.000", aviso.text)
        self.evidencia("CP-20_ingreso_registrado")

        ingreso = next(i for i in self.api("GET", "/movimientos")["datos"]["ingresos"] if i["descripcion"] == marca)
        self.assertEqual(float(ingreso["valor_ingreso"]), 600000)
        self.assertEqual(float(ingreso["horas"]), 5)

        # Eliminar el registro desde el historial
        buscador = self.driver.find_element(By.ID, "buscar-movimiento")
        buscador.send_keys(marca)
        self.clic(self.espera.until(EC.element_to_be_clickable(
            (By.XPATH, "//div[@role='row'][contains(., '%s')]//button[@title='Eliminar']" % marca))))
        dialogo = self.dialogo_abierto()
        dialogo.find_element(By.XPATH, ".//button[normalize-space()='Eliminar']").click()
        self.espera.until(EC.invisibility_of_element_located((By.CSS_SELECTOR, "dialog.admin-dialogo[open]")))
        restantes = [i for i in self.api("GET", "/movimientos")["datos"]["ingresos"] if i["descripcion"] == marca]
        self.assertEqual(restantes, [])

    @caso("CP-21", "Registrar un egreso desde el formulario", "RF-06",
          "Registrar un egreso de $350.000 para la máquina 023Y, probando antes la validación del valor.",
          "Sin valor el navegador no deja enviar; con valor se guarda sin pedir cliente ni horas.")
    def test_cp21_registrar_egreso(self):
        self.entrar()
        self.abrir("/movimientos")
        form = self.espera.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "form.mov-form")))
        form.find_element(By.XPATH, ".//button[@aria-pressed][contains(., 'Egreso')]").click()
        self.assertEqual(form.find_elements(By.NAME, "id_cliente"), [])
        self.assertEqual(form.find_elements(By.NAME, "horas"), [])
        self.fijar_valor(form.find_element(By.NAME, "fecha"), hoy())
        Select(form.find_element(By.NAME, "id_maquina")).select_by_value("3")
        self.clic(form.find_element(By.CSS_SELECTOR, "button[type=submit]"))
        self.assertCampoInvalido(form.find_element(By.NAME, "valor"))
        self.assertEqual(form.find_elements(By.CSS_SELECTOR, ".mov-aviso"), [])

        marca = f"Egreso Selenium {int(time.time())}"
        form.find_element(By.NAME, "valor").send_keys("350000")
        form.find_element(By.NAME, "descripcion").send_keys(marca)
        self.clic(form.find_element(By.CSS_SELECTOR, "button[type=submit]"))
        aviso = self.espera.until(EC.visibility_of_element_located((By.CSS_SELECTOR, ".mov-aviso[role=status]")))
        self.assertIn("Egreso registrado", aviso.text)
        self.evidencia("CP-21_egreso_registrado")
        egreso = next(e for e in self.api("GET", "/movimientos")["datos"]["egresos"] if e["descripcion"] == marca)
        self.assertEqual(float(egreso["valor_egreso"]), 350000)
        self.api("DELETE", f"/movimientos/egreso/{egreso['id_egreso']}")

    @caso("CP-22", "Dashboard mensual actualizado", "RF-07",
          "Registrar un egreso de $1.000.000 este mes y volver a cargar el inicio.",
          "La tarjeta 'Egresos del mes' suma el nuevo valor.")
    def test_cp22_dashboard_se_actualiza(self):
        self.entrar()
        periodo = hoy()[:7]

        def egresos_del_mes():
            return sum(float(e["valor_egreso"]) for e in self.api("GET", "/movimientos")["datos"]["egresos"]
                       if e["fecha"].startswith(periodo))

        antes = egresos_del_mes()
        r = self.api("POST", "/movimientos", {"tipo": "egreso", "id_maquina": 2, "valor": 1000000,
                                               "fecha": hoy(), "descripcion": "Egreso CP-22"})
        self.assertEqual(r["status"], 201, r)
        try:
            self.abrir("/home")
            tarjeta = self.espera.until(EC.visibility_of_element_located(
                (By.XPATH, "//article[contains(@class,'stat-card')][.//span[contains(., 'Egresos del mes')]]")))
            self.assertEqual(tarjeta.find_element(By.CSS_SELECTOR, ".stat-card-valor").text,
                             moneda_compacta(antes + 1000000))
            self.evidencia("CP-22_dashboard_actualizado")
        finally:
            id_egreso = r["datos"].get("id_egreso") or r["datos"].get("id")
            if id_egreso:
                self.api("DELETE", f"/movimientos/egreso/{id_egreso}")

    # --------------------------------------------------------- solicitudes
    @caso("CP-09 / CP-10", "Solicitud pública y cambio de estado", "RF-10 / RF-11",
          "Enviar una solicitud desde /solicitar y marcarla como 'Contactado' desde el panel.",
          "Se asigna un número, llega como Pendiente y el estado cambia a Contactado.")
    def test_cp09_y_cp10_solicitud_y_cambio_de_estado(self):
        # CP-09: el cliente envía la solicitud desde el portal público
        self.abrir("/solicitar")
        form = self.espera.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "form.portal-form")))
        form.find_element(By.NAME, "nombre_obra").send_keys("Obra Selenium")
        form.find_element(By.NAME, "nombre_empresa").send_keys("Constructora de Pruebas")
        form.find_element(By.NAME, "nombre_responsable").send_keys("Ana Prueba")
        form.find_element(By.NAME, "telefono").send_keys("3105556677")
        Select(form.find_element(By.NAME, "tipo_maquina")).select_by_value("Bulldozer")
        fecha = (datetime.date.today() + datetime.timedelta(days=10)).isoformat()
        self.fijar_valor(form.find_element(By.NAME, "fecha_requerida"), fecha)
        form.find_element(By.NAME, "horas_estimadas").send_keys("16")
        form.find_element(By.NAME, "descripcion").send_keys("Solicitud creada por la prueba automatizada CP-09.")
        self.clic(form.find_element(By.CSS_SELECTOR, "button[type=submit]"))
        numero = self.espera.until(
            EC.visibility_of_element_located((By.XPATH, "//div[span='Número']/strong"))
        ).text
        id_solicitud = int(numero.lstrip("#"))
        self.evidencia("CP-09_solicitud_enviada")

        # La solicitud queda Pendiente para la empresa
        self.entrar()
        r = self.api("GET", f"/solicitudes/{id_solicitud}")
        self.assertEqual(r["status"], 200)
        self.assertEqual(r["datos"]["estado"], "Pendiente")

        # CP-10: cambiar el estado desde el detalle
        self.abrir(f"/solicitud/{id_solicitud}")
        self.clic(self.espera.until(
            EC.element_to_be_clickable((By.XPATH, "//div[@class='acciones-estado']/button[contains(., 'Contactado')]"))
        ))
        aviso = self.espera.until(EC.visibility_of_element_located((By.CSS_SELECTOR, ".aviso-exito[role=status]")))
        self.driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", aviso)
        self.evidencia("CP-10_estado_actualizado")
        self.assertEqual(self.api("GET", f"/solicitudes/{id_solicitud}")["datos"]["estado"], "Contactado")

    @caso("CP-23", "Buscar y filtrar solicitudes", "RF-11",
          "Filtrar el listado por 'Pendiente' y buscar por nombre de obra.",
          "Solo quedan filas con estado Pendiente y la búsqueda reduce el listado.")
    def test_cp23_filtrar_solicitudes(self):
        self.entrar()
        self.abrir("/solicitudes")
        filas = lambda: self.driver.find_elements(By.CSS_SELECTOR, "a.solicitud-fila")  # noqa: E731
        self.espera.until(lambda d: filas())
        total = len(filas())
        self.clic(self.driver.find_element(By.XPATH, "//button[@role='tab'][normalize-space()='Pendiente']"))
        estados = [f.find_element(By.CSS_SELECTOR, ".estado-pill").text for f in filas()]
        self.assertTrue(estados, "Se esperaba al menos una solicitud Pendiente en el seed")
        self.assertEqual(set(estados), {"Pendiente"})
        self.clic(self.driver.find_element(By.XPATH, "//button[@role='tab'][normalize-space()='Todas']"))
        obra = self.api("GET", "/clientes")["datos"][0]["nombre_obra"]
        self.driver.find_element(By.CSS_SELECTOR, "input[placeholder^='Buscar por cliente']").send_keys(obra)
        time.sleep(0.3)
        self.assertLessEqual(len(filas()), total)
        self.assertTrue(all(obra in f.text for f in filas()))
        self.evidencia("CP-23_solicitudes_filtradas")

    @caso("CP-24", "Fecha pasada en la solicitud pública (formulario)", "RF-10",
          "Escribir una fecha de ayer en el formulario público.",
          "El campo tiene como mínimo la fecha de hoy y el navegador no permite enviarlo.")
    def test_cp24_solicitud_fecha_pasada_formulario(self):
        self.abrir("/solicitar")
        campo = self.espera.until(EC.presence_of_element_located((By.NAME, "fecha_requerida")))
        self.assertEqual(campo.get_attribute("min"), hoy())
        ayer = (datetime.date.today() - datetime.timedelta(days=1)).isoformat()
        self.fijar_valor(campo, ayer)
        self.assertFalse(self.driver.execute_script("return arguments[0].checkValidity();", campo))

    @caso("CP-25", "Fecha pasada en la solicitud pública (API)", "RF-10",
          "Enviar directamente a la API pública una solicitud con fecha de ayer.",
          "La API rechaza la solicitud con 400 (la validación no debe depender solo del navegador).")
    def test_cp25_solicitud_fecha_pasada_api(self):
        self.abrir("/solicitar")
        ayer = (datetime.date.today() - datetime.timedelta(days=1)).isoformat()
        r = self.api("POST", "/publico/solicitudes", {
            "nombre_obra": "Obra CP-25", "nombre_responsable": "Prueba", "telefono": "3000000000",
            "tipo_maquina": "Pajarita", "fecha_requerida": ayer, "horas_estimadas": 4,
        })
        self.assertEqual(r["status"], 400, f"La API aceptó una fecha pasada: {r}")

    # ------------------------------------------------- navegación e interfaz
    @caso("CP-11", "Vista en teléfono", "RNF Usabilidad",
          "Abrir el panel con una pantalla de 360 px.",
          "El menú pasa a una barra fija abajo y no hay desplazamiento horizontal.")
    def test_cp11_vista_telefono(self):
        self.driver.quit()
        self.driver = crear_driver(400, 860)
        # Chrome no reduce la ventana por debajo de ~500 px: se emula un teléfono de 360 px
        self.driver.execute_cdp_cmd("Emulation.setDeviceMetricsOverride",
                                    {"width": 360, "height": 780, "deviceScaleFactor": 2, "mobile": True})
        self.espera = WebDriverWait(self.driver, 15)
        self.entrar()
        nav = self.espera.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "nav.nav")))
        time.sleep(0.5)
        medidas = self.driver.execute_script(
            "const n=arguments[0].getBoundingClientRect();"
            "const a=document.querySelector('.ayuda-boton').getBoundingClientRect();"
            "return {ancho: window.innerWidth, alto: window.innerHeight, scroll: document.documentElement.scrollWidth,"
            " navTop: n.top, navBottom: n.bottom, pos: getComputedStyle(arguments[0]).position, ayudaBottom: a.bottom};",
            nav,
        )
        self.evidencia("CP-11_vista_telefono")
        self.assertEqual(medidas["ancho"], 360, medidas)
        self.assertEqual(medidas["pos"], "fixed", medidas)
        self.assertGreater(medidas["navTop"], medidas["alto"] / 2, medidas)
        self.assertLessEqual(medidas["scroll"], medidas["ancho"], f"Desborde horizontal: {json.dumps(medidas)}")
        self.assertLessEqual(medidas["ayudaBottom"], medidas["navTop"], "El botón de ayuda tapa el menú")

    @caso("CP-15", "Navegación del menú lateral", "RNF Usabilidad",
          "Recorrer las seis opciones del menú lateral.",
          "Cada enlace abre su vista, con su título y la opción marcada como activa.")
    def test_cp15_navegacion_menu(self):
        self.entrar()
        destinos = {
            "Inicio": ("/home", "Resumen de operación"),
            "Maquinaria": ("/maquinaria", "Maquinaria"),
            "Operadores": ("/operadores", "Operadores"),
            "Clientes": ("/clientes", "Clientes"),
            "Solicitudes": ("/solicitudes", "Solicitudes"),
            "Movimientos": ("/movimientos", "Ingresos y egresos"),
        }
        for texto, (ruta, titulo) in destinos.items():
            with self.subTest(enlace=texto):
                self.clic(self.driver.find_element(By.XPATH, f"//nav[@class='nav']/a[normalize-space()='{texto}']"))
                self.espera.until(lambda d: d.current_url.rstrip("/").endswith(ruta))
                self.assertEqual(self.titulo_pagina(), titulo)
                activo = self.driver.find_element(By.CSS_SELECTOR, "nav.nav a[aria-current=page]")
                self.assertEqual(activo.text.strip(), texto)

    @caso("CP-26", "Rutas antiguas redirigen", "RNF Mantenibilidad",
          "Abrir las rutas viejas /admin y /asignaciones.",
          "Redirigen a su vista actual (/maquinaria).")
    def test_cp26_redirecciones(self):
        self.entrar()
        for ruta in ["/admin", "/asignaciones", "/admin/operadores"]:
            with self.subTest(ruta=ruta):
                self.abrir(ruta)
                destino = "/operadores" if ruta.endswith("operadores") else "/maquinaria"
                self.espera.until(lambda d: d.current_url.rstrip("/").endswith(destino))

    @caso("CP-28", "Botón de ayuda en cada vista", "RNF Usabilidad",
          "Abrir el botón '?' de la esquina inferior derecha en todas las vistas.",
          "Aparece abajo a la derecha, muestra la guía de esa página y se cierra con Escape.")
    def test_cp28_ayuda_en_cada_vista(self):
        vistas = [
            ("/login", "Iniciar sesión"),
            ("/solicitar", "Solicitar una máquina"),
        ]
        privadas = [
            ("/home", "Inicio"),
            ("/maquinaria", "Maquinaria"),
            ("/maquinaria/387J", "Detalle de máquina"),
            ("/operadores", "Operadores"),
            ("/operador/1", "Detalle de operador"),
            ("/clientes", "Clientes"),
            ("/solicitudes", "Solicitudes"),
            ("/solicitud/1", "Detalle de solicitud"),
            ("/movimientos", "Ingresos y egresos"),
        ]

        def revisar(ruta, titulo):
            self.abrir(ruta)
            boton = self.espera.until(EC.element_to_be_clickable((By.CSS_SELECTOR, ".ayuda-boton")))
            caja = boton.rect
            ancho, alto = self.driver.execute_script("return [innerWidth, innerHeight]")
            self.assertGreater(caja["x"], ancho - 100, f"{ruta}: no está a la derecha")
            self.assertGreater(caja["y"], alto - 100, f"{ruta}: no está abajo")
            boton.click()
            panel = self.espera.until(EC.visibility_of_element_located((By.CSS_SELECTOR, ".ayuda-panel")))
            self.assertEqual(panel.find_element(By.CSS_SELECTOR, ".ayuda-titulo").text, titulo)
            self.assertGreaterEqual(len(panel.find_elements(By.TAG_NAME, "li")), 2)
            return panel

        for ruta, titulo in vistas:
            with self.subTest(ruta=ruta):
                revisar(ruta, titulo)
        self.entrar()
        for ruta, titulo in privadas:
            with self.subTest(ruta=ruta):
                revisar(ruta, titulo)
                if ruta == "/home":
                    time.sleep(0.3)
                    self.evidencia("CP-28_ayuda_inicio")
                self.driver.find_element(By.TAG_NAME, "body").send_keys(Keys.ESCAPE)
                self.espera.until(EC.invisibility_of_element_located((By.CSS_SELECTOR, ".ayuda-panel")))

    @caso("CP-29", "Íconos del menú y del inicio", "RNF Usabilidad",
          "Revisar el ícono de 'Maquinaria' en el menú y el de 'Egresos del mes' en el inicio.",
          "Maquinaria usa la silueta de excavadora del logo y Egresos una flecha hacia abajo.")
    def test_cp29_iconos(self):
        self.entrar()
        icono_maquinaria = self.driver.find_element(By.CSS_SELECTOR, "nav.nav a[href='/maquinaria'] svg")
        trazos = [p.get_attribute("d") for p in icono_maquinaria.find_elements(By.TAG_NAME, "path")]
        self.assertEqual(len(icono_maquinaria.find_elements(By.TAG_NAME, "rect")), 1, "Faltan las orugas")
        self.assertEqual(len(trazos), 3, "La excavadora tiene cabina, brazo y cucharón")
        self.assertFalse(icono_maquinaria.find_elements(By.TAG_NAME, "circle"), "Sigue siendo el camión")
        tarjeta = self.driver.find_element(
            By.XPATH, "//article[contains(@class,'stat-card')][.//span[contains(., 'Egresos del mes')]]")
        flecha = [p.get_attribute("d") for p in tarjeta.find_elements(By.CSS_SELECTOR, ".stat-card-icono path")]
        self.assertEqual(flecha, ["M12 5v14M6 13l6 6 6-6"])
        self.evidencia("CP-29_iconos")


if __name__ == "__main__":
    unittest.main(verbosity=2)
