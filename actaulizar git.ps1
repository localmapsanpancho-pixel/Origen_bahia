.\actualizar.ps1 "Actualización de marketplace.html"

.\actualizar.ps1 "Actualización de carrusel-productos.js"
.\actualizar.ps1 "Actualización de carrilo.html"


.\actualizar.ps1 "Actualización de index.html"
.\actualizar.ps1 "Actualización de server.js"

git add .
git commit -m "Actualizar imágenes"
git push origin main


git add nombre-del-archivo.ext
git commit -m "Descripción breve del cambio"
git push


git add carrusel-productos.js
git commit -m "ancho de botón de agregar al carrito reducido a 50% en pantallas pequeñas"
git push