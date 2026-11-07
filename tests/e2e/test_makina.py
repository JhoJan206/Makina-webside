"""Pruebas de sistema de MAKINA con Selenium (CP-01 a CP-11).

Se ejecutan contra una instancia con el esquema y el seed cargados
(supabase/migrations/001_esquema.sql y supabase/seed.sql). NO las ejecutes
contra producción: crean, modifican y eliminan registros.

Uso:
    pip install selenium
    npm run build && npm start            # en otra terminal
    python -m unittest tests/e2e/test_makina.py -v

Variables opcionales:
    MAKINA_URL       URL base (por defecto http://localhost:3000)
    MAKINA_USUARIO   usuario de prueba (por defecto admin, del seed)
    MAKINA_CLAVE     contraseña de prueba (por defecto la del seed)
    MAKINA_HEADLESS  "0" para ver el navegador
    MAKINA_CHROMEDRIVER  ruta a un chromedriver concreto (si no, Selenium Manager lo resuelve)
"""

import datetime
import json
import os
import time
import unittest
from pathlib import Path

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select, WebDriverWait

BASE = os.environ.get("MAKINA_URL", "http://localhost:3000").rstrip("/")
USUARIO = os.environ.get("MAKINA_USUARIO", "admin")
CLAVE = os.environ.get("MAKINA_CLAVE", "Makina2026!")
EVIDENCIAS = Path(__file__).parent / "evidencias"
EVIDENCIAS.mkdir(exist_ok=True)


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


class PruebasMakina(unittest.TestCase):
    """Cada prueba es independiente; las que necesitan sesión inician sesión."""

    def setUp(self):
        self.driver = crear_driver()
        self.espera = WebDriverWait(self.driver, 15)

    def tearDown(self):
        self.driver.quit()

    # ----------------------------------------------------------- utilidades
    def evidencia(self, nombre):
        self.driver.save_screenshot(str(EVIDENCIAS / f"{nombre}.png"))

    def abrir(self, ruta):
        self.driver.get(BASE + ruta)

    def iniciar_sesion(self, usuario=USUARIO, clave=CLAVE):
        self.abrir("/login")
        campo = self.espera.until(EC.visibility_of_element_located((By.ID, "identificador")))
        campo.clear()
        campo.send_keys(usuario)
        self.driver.find_element(By.ID, "contrasena").send_keys(clave)
        self.driver.find_element(By.CSS_SELECTOR, "form button[type=submit]").click()

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

    # --------------------------------------------------------------- casos
    def test_cp01_login_correcto(self):
        self.iniciar_sesion()
        self.esperar_url("/home")
        self.espera.until(EC.visibility_of_element_located((By.CSS_SELECTOR, ".sidebar")))
        self.assertTrue(self.driver.current_url.endswith("/home"))
        self.evidencia("CP-01_login_correcto")

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

    def test_cp03_home_sin_sesion(self):
        self.abrir("/home")
        self.esperar_url("/login")
        self.assertIn("/login", self.driver.current_url)

    def test_cp04_maquina_placa_repetida(self):
        self.iniciar_sesion()
        self.esperar_url("/home")
        self.abrir("/maquinaria")
        self.espera.until(
            EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Nueva máquina')]"))
        ).click()
        dialogo = self.espera.until(EC.visibility_of_element_located((By.CSS_SELECTOR, ".admin-dialogo")))
        Select(dialogo.find_element(By.NAME, "tipo")).select_by_value("Pajarita")
        dialogo.find_element(By.NAME, "placa").send_keys("387J")
        dialogo.find_element(By.NAME, "valor_hora").send_keys("90000")
        dialogo.find_element(By.XPATH, ".//button[contains(., 'Registrar máquina')]").click()
        error = self.espera.until(
            EC.visibility_of_element_located((By.CSS_SELECTOR, ".admin-dialogo .form-error"))
        )
        self.assertIn("Ya existe", error.text)
        self.evidencia("CP-04_placa_repetida")
        r = self.api("POST", "/maquinas", {"tipo": "Pajarita", "placa": "387J", "valor_hora": 90000})
        self.assertEqual(r["status"], 409)

    def test_cp05_eliminar_maquina_con_ingresos(self):
        self.iniciar_sesion()
        self.esperar_url("/home")
        r = self.api("DELETE", "/maquinas/1")
        self.assertEqual(r["status"], 409)
        self.assertEqual(self.api("GET", "/maquinas/1")["status"], 200)

    def test_cp06_crud_operadores_y_clientes(self):
        self.iniciar_sesion()
        self.esperar_url("/home")
        marca = str(int(time.time()))

        # Operadores
        r = self.api("POST", "/operadores", {"nombre": "Prueba", "apellido": f"Selenium{marca}",
                                              "cedula": f"9{marca}", "sueldo": 2000000})
        self.assertEqual(r["status"], 201)
        id_op = r["datos"]["id_operador"]
        self.abrir("/operadores")
        self.espera.until(EC.text_to_be_present_in_element((By.TAG_NAME, "main"), f"Selenium{marca}"))
        r = self.api("PUT", f"/operadores/{id_op}", {"apellido": f"Editado{marca}"})
        self.assertEqual(r["status"], 200)
        self.driver.refresh()
        self.espera.until(EC.text_to_be_present_in_element((By.TAG_NAME, "main"), f"Editado{marca}"))
        self.assertEqual(self.api("DELETE", f"/operadores/{id_op}")["status"], 204)
        self.driver.refresh()
        self.espera.until(EC.visibility_of_element_located((By.TAG_NAME, "main")))
        self.assertNotIn(f"Editado{marca}", self.driver.find_element(By.TAG_NAME, "main").text)

        # Clientes
        r = self.api("POST", "/clientes", {"nombre_obra": f"Obra Selenium {marca}", "telefono": "3001112233"})
        self.assertEqual(r["status"], 201)
        id_cl = r["datos"]["id_cliente"]
        self.abrir("/clientes")
        self.espera.until(EC.text_to_be_present_in_element((By.TAG_NAME, "main"), f"Obra Selenium {marca}"))
        self.assertEqual(self.api("PUT", f"/clientes/{id_cl}", {"nombre_obra": f"Obra Editada {marca}"})["status"], 200)
        self.driver.refresh()
        self.espera.until(EC.text_to_be_present_in_element((By.TAG_NAME, "main"), f"Obra Editada {marca}"))
        self.assertEqual(self.api("DELETE", f"/clientes/{id_cl}")["status"], 204)
        self.driver.refresh()
        self.espera.until(EC.visibility_of_element_located((By.TAG_NAME, "main")))
        self.assertNotIn(f"Obra Editada {marca}", self.driver.find_element(By.TAG_NAME, "main").text)

    def test_cp07_asignar_operador_a_maquina_ocupada(self):
        self.iniciar_sesion()
        self.esperar_url("/home")
        abiertas = [a for a in self.api("GET", "/asignaciones")["datos"] if a["fecha_salida"] is None]
        ocupada = next(a for a in abiertas if a["id_maquina"] == 1)
        ocupados = {a["id_operador"] for a in abiertas}
        libres = [o["id_operador"] for o in self.api("GET", "/operadores")["datos"]
                  if o["id_operador"] not in ocupados]
        self.assertTrue(libres, "Se necesita un operador libre en los datos de prueba")
        hoy = datetime.date.today().isoformat()
        r = self.api("POST", "/asignaciones", {"id_maquina": 1, "id_operador": libres[0], "fecha_ingreso": hoy})
        self.assertEqual(r["status"], 201, r)
        self.assertEqual(r["datos"]["asignacion"]["fecha_salida"], None)
        cerradas = {c["id"]: c for c in r["datos"]["cerradas"]}
        self.assertIn(ocupada["id"], cerradas)
        self.assertEqual(cerradas[ocupada["id"]]["fecha_salida"], hoy)

    def test_cp08_ingreso_sin_cliente(self):
        self.iniciar_sesion()
        self.esperar_url("/home")
        r = self.api("POST", "/movimientos", {"tipo": "ingreso", "id_maquina": 1, "valor": 100000,
                                               "horas": 2, "fecha": datetime.date.today().isoformat()})
        self.assertEqual(r["status"], 400)
        self.assertIn("id_cliente", r["datos"]["detalles"])

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
        self.driver.execute_script(
            "const i=arguments[0]; const s=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;"
            "s.call(i, arguments[1]); i.dispatchEvent(new Event('input',{bubbles:true}));"
            "i.dispatchEvent(new Event('change',{bubbles:true}));",
            form.find_element(By.NAME, "fecha_requerida"), fecha,
        )
        form.find_element(By.NAME, "horas_estimadas").send_keys("16")
        form.find_element(By.NAME, "descripcion").send_keys("Solicitud creada por la prueba automatizada CP-09.")
        self.clic(form.find_element(By.CSS_SELECTOR, "button[type=submit]"))
        numero = self.espera.until(
            EC.visibility_of_element_located((By.XPATH, "//div[span='Número']/strong"))
        ).text
        id_solicitud = int(numero.lstrip("#"))
        self.evidencia("CP-09_solicitud_enviada")

        # La solicitud queda Pendiente para la empresa
        self.iniciar_sesion()
        self.esperar_url("/home")
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

    def test_cp11_vista_telefono(self):
        self.driver.quit()
        self.driver = crear_driver(400, 860)
        # Chrome no reduce la ventana por debajo de ~500 px: se emula un teléfono de 360 px
        self.driver.execute_cdp_cmd("Emulation.setDeviceMetricsOverride",
                                    {"width": 360, "height": 780, "deviceScaleFactor": 2, "mobile": True})
        self.espera = WebDriverWait(self.driver, 15)
        self.iniciar_sesion()
        self.esperar_url("/home")
        nav = self.espera.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "nav.nav")))
        time.sleep(0.5)
        medidas = self.driver.execute_script(
            "const n=arguments[0].getBoundingClientRect();"
            "return {ancho: window.innerWidth, alto: window.innerHeight, scroll: document.documentElement.scrollWidth,"
            " navTop: n.top, navBottom: n.bottom, pos: getComputedStyle(arguments[0]).position};",
            nav,
        )
        self.evidencia("CP-11_vista_telefono")
        self.assertEqual(medidas["ancho"], 360, medidas)
        self.assertEqual(medidas["pos"], "fixed", medidas)
        self.assertGreater(medidas["navTop"], medidas["alto"] / 2, medidas)
        self.assertLessEqual(medidas["scroll"], medidas["ancho"], f"Desborde horizontal: {json.dumps(medidas)}")


if __name__ == "__main__":
    unittest.main(verbosity=2)
