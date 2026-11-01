// Arma "SET col1 = $1, col2 = $2" a partir de un objeto ya validado.
export function setDinamico(datos, desde = 1) {
  const columnas = Object.keys(datos);

  return {
    set: columnas.map((columna, i) => `${columna} = $${desde + i}`).join(', '),
    valores: columnas.map((columna) => datos[columna]),
  };
}
