"""Ejecuta las pruebas de Selenium de MAKINA y genera el reporte en PDF.

    python tests/e2e/ejecutar_pruebas.py

Requisitos: pip install selenium fpdf2
El PDF queda en docs/Reporte de Pruebas MAKINA.pdf (o en la ruta de MAKINA_REPORTE).
"""

import datetime
import os
import platform
import sys
import time
import traceback
import unittest
from pathlib import Path

from fpdf import FPDF
from fpdf.enums import XPos, YPos

AQUI = Path(__file__).resolve().parent
RAIZ = AQUI.parents[1]
sys.path.insert(0, str(AQUI))

import test_makina  # noqa: E402

SALIDA = Path(os.environ.get("MAKINA_REPORTE", RAIZ / "docs" / "Reporte de Pruebas MAKINA.pdf"))
LOGO = RAIZ / "public" / "img" / "logo_fondo_amarillo.png"

AMARILLO = (255, 203, 33)
NEGRO = (17, 17, 17)
GRIS = (107, 107, 100)
BORDE = (227, 227, 220)
FONDO = (246, 246, 242)
ESTADOS = {
    "Aprobada": ((22, 148, 74), (230, 246, 236)),
    "Fallida": ((217, 58, 48), (253, 236, 234)),
    "Error": ((217, 58, 48), (253, 236, 234)),
    "Omitida": ((180, 123, 0), (253, 243, 213)),
}


# --------------------------------------------------------------- ejecución
class Resultado(unittest.TextTestResult):
    """Guarda estado, duración y mensaje de cada caso para el reporte."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.casos = []
        self._inicio = {}

    def startTest(self, test):
        self._inicio[test.id()] = time.perf_counter()
        super().startTest(test)

    def _registro(self, test):
        for registro in self.casos:
            if registro["id"] == test.id():
                return registro
        metodo = getattr(test, test._testMethodName)
        ficha = getattr(metodo, "caso", {"codigo": test._testMethodName, "titulo": test._testMethodName,
                                        "requisito": "", "objetivo": "", "esperado": ""})
        registro = {"id": test.id(), "estado": "Aprobada", "mensaje": "", "duracion": 0.0, **ficha}
        self.casos.append(registro)
        return registro

    def _fallo(self, test, err, estado):
        registro = self._registro(test)
        registro["estado"] = estado
        registro["mensaje"] = (registro["mensaje"] + "\n" if registro["mensaje"] else "") + describir(err)

    def stopTest(self, test):
        registro = self._registro(test)
        registro["duracion"] = time.perf_counter() - self._inicio.get(test.id(), time.perf_counter())
        super().stopTest(test)

    def addFailure(self, test, err):
        super().addFailure(test, err)
        self._fallo(test, err, "Fallida")

    def addError(self, test, err):
        super().addError(test, err)
        self._fallo(test, err, "Error")

    def addSkip(self, test, reason):
        super().addSkip(test, reason)
        registro = self._registro(test)
        registro["estado"] = "Omitida"
        registro["mensaje"] = reason

    def addSubTest(self, test, subtest, err):
        super().addSubTest(test, subtest, err)
        if err is not None:
            estado = "Fallida" if issubclass(err[0], test.failureException) else "Error"
            self._fallo(test, err, estado)


def describir(err):
    """Mensaje corto: tipo de error, texto y la línea de la prueba donde ocurrió."""
    tipo, valor, tb = err
    texto = str(valor).strip().splitlines()[0] if str(valor).strip() else ""
    if tipo.__name__ == "TimeoutException":
        texto = "El elemento esperado no apareció a tiempo."
    linea = ""
    for marco in traceback.extract_tb(tb):
        if marco.filename.endswith("test_makina.py"):
            linea = f" (línea {marco.lineno}: {marco.line.strip()})"
    return f"{tipo.__name__}: {texto[:400]}{linea}"


def ejecutar():
    suite = unittest.defaultTestLoader.loadTestsFromModule(test_makina)
    corredor = unittest.TextTestRunner(verbosity=2, resultclass=Resultado)
    inicio = datetime.datetime.now()
    resultado = corredor.run(suite)
    fin = datetime.datetime.now()
    return resultado, inicio, fin


def entorno():
    datos = {
        "URL probada": test_makina.BASE,
        "Sistema operativo": f"{platform.system()} {platform.release()}",
        "Python": platform.python_version(),
    }
    try:
        import selenium

        datos["Selenium"] = selenium.__version__
        driver = test_makina.crear_driver()
        datos["Navegador"] = f"Chrome {driver.capabilities.get('browserVersion', '?')}"
        driver.quit()
    except Exception:  # noqa: BLE001
        pass
    datos["Modo"] = "Headless" if os.environ.get("MAKINA_HEADLESS", "1") != "0" else "Con ventana"
    return datos


# --------------------------------------------------------------------- PDF
class Reporte(FPDF):
    def __init__(self):
        super().__init__(format="A4")
        self.set_margins(18, 18, 18)
        self.set_auto_page_break(True, 20)
        fuentes = Path(os.environ.get("WINDIR", "C:/Windows")) / "Fonts"
        if (fuentes / "arial.ttf").exists():
            self.add_font("Base", "", str(fuentes / "arial.ttf"))
            self.add_font("Base", "B", str(fuentes / "arialbd.ttf"))
            self.add_font("Base", "I", str(fuentes / "ariali.ttf"))
            self.fuente = "Base"
            self.unicode = True
        else:
            self.fuente = "Helvetica"
            self.unicode = False

    def t(self, texto):
        """Texto seguro para la fuente elegida."""
        texto = str(texto)
        if self.unicode:
            return texto
        return texto.replace("×", "x").replace("—", "-").replace("…", "...").encode("latin-1", "replace").decode(
            "latin-1")

    def letra(self, estilo="", tamano=10, color=NEGRO):
        self.set_font(self.fuente, estilo, tamano)
        self.set_text_color(*color)

    def header(self):
        if self.page_no() == 1:
            return
        self.set_fill_color(*AMARILLO)
        self.rect(0, 0, self.w, 4, "F")
        self.set_y(8)
        self.letra("B", 8, GRIS)
        self.cell(0, 5, self.t("MAKINA · Reporte de pruebas de sistema"), new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(4)

    def footer(self):
        if self.page_no() == 1:
            return
        self.set_y(-14)
        self.letra("", 8, GRIS)
        self.cell(0, 5, self.t(f"Página {self.page_no()} de {{nb}}"), align="R")

    def titulo(self, texto, eyebrow=None):
        if eyebrow:
            self.letra("B", 8, (180, 123, 0))
            self.cell(0, 5, self.t(eyebrow.upper()), new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.letra("B", 18)
        self.cell(0, 10, self.t(texto), new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(2)

    def parrafo(self, texto, tamano=10, color=NEGRO, estilo=""):
        self.letra(estilo, tamano, color)
        self.multi_cell(0, tamano * 0.5, self.t(texto), new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    def pastilla(self, estado, x, y, ancho=24):
        color, fondo = ESTADOS[estado]
        self.set_fill_color(*fondo)
        self.set_draw_color(*fondo)
        self.rect(x, y, ancho, 6, "F", round_corners=True, corner_radius=3)
        self.set_xy(x, y)
        self.letra("B", 8, color)
        self.cell(ancho, 6, self.t(estado), align="C")


def construir_pdf(resultado, inicio, fin, datos_entorno):
    casos = sorted(resultado.casos, key=lambda c: orden_codigo(c["codigo"]))
    total = len(casos)
    conteo = {estado: sum(1 for c in casos if c["estado"] == estado) for estado in ESTADOS}
    aprobadas = conteo["Aprobada"]
    fallidas = conteo["Fallida"] + conteo["Error"]

    pdf = Reporte()
    pdf.alias_nb_pages()
    pdf.set_title("Reporte de pruebas de sistema - MAKINA")
    pdf.set_author("Pruebas automatizadas MAKINA")

    # ---------- Portada
    pdf.add_page()
    pdf.set_fill_color(*AMARILLO)
    pdf.rect(0, 0, pdf.w, 120, "F")
    if LOGO.exists():
        pdf.image(str(LOGO), x=(pdf.w - 70) / 2, y=22, w=70)
    pdf.set_y(135)
    pdf.letra("B", 9, (180, 123, 0))
    pdf.cell(0, 6, pdf.t("PRUEBAS AUTOMATIZADAS CON SELENIUM"), align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.letra("B", 26)
    pdf.cell(0, 14, pdf.t("Reporte de pruebas de sistema"), align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.letra("", 12, GRIS)
    pdf.cell(0, 8, pdf.t("Sistema de gestión de maquinaria pesada"), align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(10)

    # Indicadores
    tarjetas = [("Casos", total, NEGRO), ("Aprobados", aprobadas, ESTADOS["Aprobada"][0]),
                ("Fallidos", fallidas, ESTADOS["Fallida"][0]), ("Omitidos", conteo["Omitida"], ESTADOS["Omitida"][0])]
    ancho = (pdf.w - 36 - 3 * 4) / 4
    y = pdf.get_y()
    for i, (etiqueta, valor, color) in enumerate(tarjetas):
        x = 18 + i * (ancho + 4)
        pdf.set_fill_color(*FONDO)
        pdf.set_draw_color(*BORDE)
        pdf.rect(x, y, ancho, 26, "DF", round_corners=True, corner_radius=3)
        pdf.set_xy(x, y + 4)
        pdf.letra("B", 20, color)
        pdf.cell(ancho, 10, str(valor), align="C")
        pdf.set_xy(x, y + 15)
        pdf.letra("", 9, GRIS)
        pdf.cell(ancho, 6, pdf.t(etiqueta), align="C")
    pdf.set_y(y + 34)

    porcentaje = round(aprobadas / total * 100) if total else 0
    pdf.letra("B", 11)
    pdf.cell(0, 7, pdf.t(f"{porcentaje}% de los casos aprobados"), align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.letra("", 9, GRIS)
    duracion = (fin - inicio).total_seconds()
    pdf.cell(0, 6, pdf.t(f"Ejecutado el {inicio:%d/%m/%Y a las %H:%M} · duración {duracion:.0f} s"),
             align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    # ---------- Resumen
    pdf.add_page()
    pdf.titulo("Resumen de la ejecución", "Resultados")
    pdf.parrafo(
        "Cada caso abre un navegador Chrome nuevo, recorre la aplicación como lo haría un usuario y comprueba "
        "el resultado en la pantalla y en la API. Las pruebas se ejecutan contra una base de datos local "
        "cargada con el esquema y los datos de ejemplo (seed), nunca contra producción.",
        9.5, GRIS,
    )
    pdf.ln(4)

    pdf.letra("B", 10)
    pdf.cell(0, 7, pdf.t("Entorno"), new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    for clave, valor in datos_entorno.items():
        pdf.letra("", 9, GRIS)
        pdf.cell(42, 5.5, pdf.t(clave))
        pdf.letra("", 9)
        pdf.cell(0, 5.5, pdf.t(valor), new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(5)

    columnas = [("Código", 24), ("Caso de prueba", 82), ("Requisito", 32), ("Resultado", 24), ("Tiempo", 12)]
    pdf.set_fill_color(*NEGRO)
    pdf.letra("B", 8.5, (255, 255, 255))
    for nombre, ancho_col in columnas:
        pdf.cell(ancho_col, 8, pdf.t(nombre), fill=True, align="C" if nombre in ("Resultado", "Tiempo") else "L")
    pdf.ln()
    for i, c in enumerate(casos):
        if pdf.get_y() > pdf.h - 28:
            pdf.add_page()
        y = pdf.get_y()
        pdf.set_fill_color(*(FONDO if i % 2 else (255, 255, 255)))
        pdf.rect(18, y, sum(a for _, a in columnas), 8, "F")
        pdf.letra("B", 8.5)
        pdf.cell(24, 8, pdf.t(c["codigo"]))
        pdf.letra("", 8.5)
        pdf.cell(82, 8, pdf.t(recortar(pdf, c["titulo"], 80)))
        pdf.letra("", 8, GRIS)
        pdf.cell(32, 8, pdf.t(recortar(pdf, c["requisito"], 30)))
        pdf.pastilla(c["estado"], pdf.get_x() + 1, y + 1, 22)
        pdf.set_xy(18 + 24 + 82 + 32 + 24, y)
        pdf.letra("", 8, GRIS)
        pdf.cell(12, 8, f"{c['duracion']:.1f}s", align="R")
        pdf.ln()

    # ---------- Hallazgos
    problemas = [c for c in casos if c["estado"] in ("Fallida", "Error")]
    pdf.ln(6)
    pdf.letra("B", 12)
    pdf.cell(0, 8, pdf.t("Hallazgos"), new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    if problemas:
        for c in problemas:
            pdf.letra("B", 9.5, ESTADOS["Fallida"][0])
            pdf.multi_cell(0, 5.5, pdf.t(f"{c['codigo']} · {c['titulo']}"), new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            pdf.parrafo(c["mensaje"], 8.5, GRIS)
            pdf.ln(2)
    else:
        pdf.parrafo("No se encontraron fallas: todos los casos ejecutados se comportaron como se esperaba.", 9.5, GRIS)

    # ---------- Detalle por caso
    pdf.add_page()
    pdf.titulo("Detalle de los casos", "Evidencias")
    for c in casos:
        capturas = [r for r in test_makina.CAPTURAS.get(c["codigo"], []) if r.exists()]
        alto_necesario = 52 + (95 if capturas else 0)
        if pdf.get_y() + alto_necesario > pdf.h - 20:
            pdf.add_page()
        y = pdf.get_y()
        pdf.set_fill_color(*FONDO)
        pdf.set_draw_color(*BORDE)
        pdf.rect(18, y, pdf.w - 36, 10, "DF", round_corners=True, corner_radius=2)
        pdf.set_xy(21, y + 2)
        pdf.letra("B", 10)
        pdf.cell(0, 6, pdf.t(f"{c['codigo']}  ·  {c['titulo']}"))
        pdf.pastilla(c["estado"], pdf.w - 18 - 27, y + 2)
        pdf.set_y(y + 13)

        for etiqueta, valor in [("Requisito", c["requisito"]), ("Objetivo", c["objetivo"]),
                                ("Resultado esperado", c["esperado"]),
                                ("Resultado obtenido", c["mensaje"] if c["mensaje"] else
                                 "Se cumplió el resultado esperado.")]:
            pdf.letra("B", 8.5, GRIS)
            pdf.cell(36, 5, pdf.t(etiqueta))
            color = ESTADOS[c["estado"]][0] if etiqueta == "Resultado obtenido" else NEGRO
            pdf.letra("", 8.5, color)
            pdf.multi_cell(0, 5, pdf.t(valor), new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        for ruta in capturas[:2]:
            ancho_img = 140
            alto_img = ancho_img * imagen_proporcion(ruta)
            if pdf.get_y() + alto_img + 6 > pdf.h - 20:
                pdf.add_page()
            pdf.ln(2)
            x = (pdf.w - ancho_img) / 2
            pdf.image(str(ruta), x=x, y=pdf.get_y(), w=ancho_img)
            pdf.set_draw_color(*BORDE)
            pdf.rect(x, pdf.get_y(), ancho_img, alto_img)
            pdf.set_y(pdf.get_y() + alto_img + 1)
            pdf.letra("I", 7.5, GRIS)
            pdf.cell(0, 5, pdf.t(f"Captura: {ruta.name}"), align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.ln(6)

    SALIDA.parent.mkdir(parents=True, exist_ok=True)
    pdf.output(str(SALIDA))
    return SALIDA


def recortar(pdf, texto, ancho_max):
    pdf.letra("", 8.5)
    if pdf.get_string_width(pdf.t(texto)) <= ancho_max:
        return texto
    while texto and pdf.get_string_width(pdf.t(texto + "…")) > ancho_max:
        texto = texto[:-1]
    return texto + "…"


def imagen_proporcion(ruta):
    with open(ruta, "rb") as archivo:
        cabecera = archivo.read(24)
    ancho = int.from_bytes(cabecera[16:20], "big")
    alto = int.from_bytes(cabecera[20:24], "big")
    return alto / ancho if ancho else 0.63


def orden_codigo(codigo):
    numero = "".join(ch for ch in codigo.split("/")[0] if ch.isdigit())
    return int(numero) if numero else 999


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    for viejo in test_makina.EVIDENCIAS.glob("*.png"):
        viejo.unlink()
    datos_entorno = entorno()
    resultado, inicio, fin = ejecutar()
    ruta = construir_pdf(resultado, inicio, fin, datos_entorno)
    print(f"\nReporte PDF: {ruta}")
    sys.exit(0 if resultado.wasSuccessful() else 1)
