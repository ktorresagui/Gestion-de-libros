// Si sirves el frontend desde el mismo Express (public/), no necesitas poner host.
// Esto funciona en http://localhost:3000/
const API_BASE = "/api/libros";

const tbodyLibros = document.getElementById("tbodyLibros");

const formAgregar = document.getElementById("formAgregar");
const titulo = document.getElementById("titulo");
const autor = document.getElementById("autor");
const msgAgregar = document.getElementById("msgAgregar");

const btnRefrescar = document.getElementById("btnRefrescar");
const msgLista = document.getElementById("msgLista");

const formEditar = document.getElementById("formEditar");
const editId = document.getElementById("editId");
const editTitulo = document.getElementById("editTitulo");
const editAutor = document.getElementById("editAutor");
const btnLimpiarEdicion = document.getElementById("btnLimpiarEdicion");
const msgEditar = document.getElementById("msgEditar");

const formEliminar = document.getElementById("formEliminar");
const deleteId = document.getElementById("deleteId");
const msgEliminar = document.getElementById("msgEliminar");

// Helpers
function setMsg(el, text, type = "info") {
  // type: info | ok | err
  el.textContent = text || "";
  if (type === "ok") el.style.color = "rgba(140, 255, 190, 0.9)";
  else if (type === "err") el.style.color = "rgba(255, 140, 140, 0.95)";
  else el.style.color = "";
}

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  // Intentar parsear JSON siempre
  let data = null;
  const isJson = res.headers.get("content-type")?.includes("application/json");
  if (isJson) data = await res.json();

  if (!res.ok) {
    const message = data?.message || `Error HTTP ${res.status}`;
    throw new Error(message);
  }
  return data;
}

// CRUD
async function cargarLibros() {
  setMsg(msgLista, "Cargando...", "info");
  try {
    const libros = await request(API_BASE);
    renderTabla(libros);
    setMsg(msgLista, `Listo. Total: ${libros.length}`, "ok");
  } catch (err) {
    renderTabla([]);
    setMsg(msgLista, err.message, "err");
  }
}

function renderTabla(libros) {
  tbodyLibros.innerHTML = "";

  if (!libros.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="4" class="muted">No hay libros.</td>`;
    tbodyLibros.appendChild(tr);
    return;
  }

  for (const libro of libros) {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${libro.id}</td>
      <td>${escapeHtml(libro.titulo)}</td>
      <td>${escapeHtml(libro.autor)}</td>
      <td>
        <div class="actions">
          <button class="btn" data-action="edit" data-id="${libro.id}">Editar</button>
          <button class="btn danger" data-action="delete" data-id="${libro.id}">Eliminar</button>
        </div>
      </td>
    `;

    tbodyLibros.appendChild(tr);
  }
}

// Evitar inyección al renderizar strings en innerHTML
function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function agregarLibro(titulo, autor) {
  return request(API_BASE, {
    method: "POST",
    body: JSON.stringify({ titulo, autor }),
  });
}

async function actualizarLibro(id, payload) {
  return request(`${API_BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

async function eliminarLibro(id) {
  return request(`${API_BASE}/${id}`, {
    method: "DELETE",
  });
}

// Eventos
btnRefrescar.addEventListener("click", () => cargarLibros());

formAgregar.addEventListener("submit", async (e) => {
  e.preventDefault();
  setMsg(msgAgregar, "", "info");

  const t = titulo.value.trim();
  const a = autor.value.trim();

  if (!t || !a) {
    setMsg(msgAgregar, "Título y autor son obligatorios.", "err");
    return;
  }

  try {
    const creado = await agregarLibro(t, a);
    setMsg(msgAgregar, `Agregado: #${creado.id} "${creado.titulo}"`, "ok");
    formAgregar.reset();
    await cargarLibros();
  } catch (err) {
    setMsg(msgAgregar, err.message, "err");
  }
});

formEditar.addEventListener("submit", async (e) => {
  e.preventDefault();
  setMsg(msgEditar, "", "info");

  const id = Number(editId.value);
  if (!Number.isInteger(id) || id <= 0) {
    setMsg(msgEditar, "ID inválido.", "err");
    return;
  }

  // Tu backend acepta campos opcionales con || (si no mandas nada, deja igual)
  const payload = {};
  const t = editTitulo.value.trim();
  const a = editAutor.value.trim();
  if (t) payload.titulo = t;
  if (a) payload.autor = a;

  if (!payload.titulo && !payload.autor) {
    setMsg(msgEditar, "Escribe al menos un campo para actualizar.", "err");
    return;
  }

  try {
    const actualizado = await actualizarLibro(id, payload);
    setMsg(msgEditar, `Actualizado: #${actualizado.id}`, "ok");
    await cargarLibros();
  } catch (err) {
    setMsg(msgEditar, err.message, "err");
  }
});

btnLimpiarEdicion.addEventListener("click", () => {
  formEditar.reset();
  setMsg(msgEditar, "", "info");
});

formEliminar.addEventListener("submit", async (e) => {
  e.preventDefault();
  setMsg(msgEliminar, "", "info");

  const id = Number(deleteId.value);
  if (!Number.isInteger(id) || id <= 0) {
    setMsg(msgEliminar, "ID inválido.", "err");
    return;
  }

  const ok = confirm(`¿Seguro que quieres eliminar el libro #${id}?`);
  if (!ok) return;

  try {
    const resp = await eliminarLibro(id);
    setMsg(msgEliminar, resp.message || "Libro eliminado.", "ok");
    formEliminar.reset();
    await cargarLibros();
  } catch (err) {
    setMsg(msgEliminar, err.message, "err");
  }
});

// Clicks en botones Editar/Eliminar de la tabla (event delegation)
tbodyLibros.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;

  const action = btn.dataset.action;
  const id = Number(btn.dataset.id);

  if (action === "edit") {
    // Rellenar formulario editar con ese ID
    editId.value = id;
    editTitulo.value = "";
    editAutor.value = "";
    setMsg(msgEditar, `Editando libro #${id}. Escribe cambios y guarda.`, "info");
    editTitulo.focus();
  }

  if (action === "delete") {
    const ok = confirm(`¿Seguro que quieres eliminar el libro #${id}?`);
    if (!ok) return;

    try {
      await eliminarLibro(id);
      setMsg(msgEliminar, `Eliminado libro #${id}`, "ok");
      await cargarLibros();
    } catch (err) {
      setMsg(msgEliminar, err.message, "err");
    }
  }
});

// Inicial
cargarLibros();