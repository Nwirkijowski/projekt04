import express from "express"; 
import session from "express-session"; 
import bcrypt from "bcrypt"; 
import db from "./db.js"; 

const app = express(); 
app.use(express.static("public")); 

app.use(express.urlencoded({ extended: true })); 


app.use(session({
  secret: "tajne", 
  resave: false,
  saveUninitialized: false
}));

app.set("view engine", "ejs"); 


function isAuth(req, res, next) {
  if (!req.session.user) return res.redirect("/login"); 
  next(); 
}

// STRONA GŁÓWNA
app.get("/", (req, res) => {
  const entries = db.prepare("SELECT * FROM entries").all(); 
  

  res.render("index", { entries, user: req.session.user }); 
  
});

// REJESTRACJA 
app.get("/register", (req, res) => {
  res.render("register");
});

// REJESTRACJA 
app.post("/register", (req, res) => {
  const { username, password } = req.body;

  const hash = bcrypt.hashSync(password, 10); 
  

  try {
    db.prepare("INSERT INTO users (username, password) VALUES (?, ?)")
      .run(username, hash); 

    res.redirect("/login");
  } catch {
    res.send("Uzytkownik istnieje"); 
  }
});

// LOGOWANIE 
app.get("/login", (req, res) => {
  res.render("login");
});

// LOGOWANIE 
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  const user = db.prepare("SELECT * FROM users WHERE username = ?")
    .get(username); 

  if (user && bcrypt.compareSync(password, user.password)) {

    req.session.user = user; 
    res.redirect("/");
  } else {
    res.send("Bledne dane, sproboj ponownie");
  }
});

// WYLOGOWANIE
app.get("/logout", (req, res) => {
  req.session.destroy(); 
  res.redirect("/");
});

// DODAWANIE 
app.get("/add", isAuth, (req, res) => {
  res.render("add");
});

// DODAWANIE 
app.post("/add", isAuth, (req, res) => {
  db.prepare("INSERT INTO entries (name, userId) VALUES (?, ?)")
    .run(req.body.name, req.session.user.id);

  res.redirect("/");
});

// EDYCJA (formularz)
app.get("/edit/:id", isAuth, (req, res) => {
  const entry = db.prepare("SELECT * FROM entries WHERE id=?")
    .get(req.params.id); 

  if (entry.userId !== req.session.user.id && !req.session.user.isAdmin) {
    return res.send("Brak dostepu");
  }

  res.render("edit", { entry });
});

// EDYCJA 
app.post("/edit/:id", isAuth, (req, res) => {
  const entry = db.prepare("SELECT * FROM entries WHERE id=?")
    .get(req.params.id);

  if (entry.userId !== req.session.user.id && !req.session.user.isAdmin) {
    return res.send("Brak dostepu");
  }

  db.prepare("UPDATE entries SET name=? WHERE id=?")
    .run(req.body.name, req.params.id); 
 

  res.redirect("/");
});

// USUWANIE
app.post("/delete/:id", isAuth, (req, res) => {
  const entry = db.prepare("SELECT * FROM entries WHERE id=?")
    .get(req.params.id);

  if (entry.userId !== req.session.user.id && !req.session.user.isAdmin) {
    return res.send("Brak dostepu");
  }

  db.prepare("DELETE FROM entries WHERE id=?")
    .run(req.params.id); 

  res.redirect("/");
});

// URUCHOMIENIE 
app.listen(3000, () => {
  console.log("http://localhost:3000");
});