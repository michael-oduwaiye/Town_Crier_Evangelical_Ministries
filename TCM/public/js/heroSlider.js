const slides = document.querySelectorAll(".hero-slide");

let current = 0;

function nextSlide() {
  slides[current].classList.remove("opacity-100");
  slides[current].classList.add("opacity-0");

  current = (current + 1) % slides.length;

  slides[current].classList.remove("opacity-0");
  slides[current].classList.add("opacity-100");
}

setInterval(nextSlide, 5000);

console.log("Hero slider working");