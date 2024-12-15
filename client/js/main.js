console.log("hello")
document.addEventListener('DOMContentLoaded', () => {
    fetch('http://localhost/NajeekaiAPI/api/customer.php')
      .then(response => response.json())
      .then(data => {
        console.log("Akjsd");
        console.log(data);
        document.getElementById('app').innerHTML = 
          `<p class="text-blue-500">${data.message}</p>`;
      });
  });