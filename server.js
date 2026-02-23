const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('public'));

// BASE DE DATOS (en memoria)
let libros = [
  { id: 1, titulo: 'El Gran Gatsby', autor: 'F. Scott Fitzgerald' },
  { id: 2, titulo: 'Cien Años de Soledad', autor: 'Gabriel García Márquez' },
  { id: 3, titulo: 'Don Quijote de la Mancha', autor: 'Miguel de Cervantes' }
];

// OPERACIONE GET: OBTENER TODOS LOS LIBROS
app.get('/api/libros', (req, res) => {
  res.json(libros);
});

// OPERACIONE POST: AGREGAR UN NUEVO LIBRO
app.post('/api/libros', (req, res) => {
  const nuevoLibro = {
    id: libros.length + 1,
    titulo: req.body.titulo,
    autor: req.body.autor
  };

  libros.push(nuevoLibro);
  res.status(201).json(nuevoLibro);
});

// OPERACION PUT: ACTUALIZAR UN LIBRO EXISTENTE
app.put('/api/libros/:id', (req, res) => {
    const libroId = parseInt(req.params.id);
    const libro = libros.find(b => b.id === libroId);

    if (libro) {
        libro.titulo = req.body.titulo || libro.titulo;
        libro.autor = req.body.autor || libro.autor;
        res.json(libro);
    } else {
        res.status(404).json({ message: 'Libro no encontrado' });
    }
});

// OPERACION DELETE: ELIMINAR UN LIBRO EXISTENTE
app.delete('/api/libros/:id', (req, res) => {
    const libroId = parseInt(req.params.id);
    const index = libros.findIndex(b => b.id === libroId);

    if (index !== -1) {
        libros.splice(index, 1);
        res.json({ message: 'Libro eliminado' });
    } else {
        res.status(404).json({ message: 'Libro no encontrado' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});