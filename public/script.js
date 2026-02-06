function pokaz() {
  document.getElementById("popup").style.display = "block";
}

function zamknij() {
  document.getElementById("popup").style.display = "none";
}

async function zapiszNewsletter() {
  const email = document.getElementById("newsletter-email").value;

  if (!email || !email.includes("@")) {
    alert("Podaj poprawny adres e-mail");
    return;
  }

  try {
    const res = await fetch("/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    if (res.ok) {
      alert("Dziękujemy za zapis! 🎉");
      document.getElementById("newsletter-email").value = "";
    } else {
      alert("Błąd zapisu");
    }
  } catch (err) {
    alert("Błąd połączenia z serwerem");
  }
}
