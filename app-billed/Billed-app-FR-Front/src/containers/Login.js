import { ROUTES_PATH } from "../constants/routes.js";
export let PREVIOUS_LOCATION = "";

export default class Login {
  constructor({
    document,
    localStorage,
    onNavigate,
    PREVIOUS_LOCATION,
    store,
  }) {
    this.document = document;
    this.localStorage = localStorage;
    this.onNavigate = onNavigate;
    this.PREVIOUS_LOCATION = PREVIOUS_LOCATION;
    this.store = store;
    const formEmployee = this.document.querySelector(
      `form[data-testid="form-employee"]`
    );
    formEmployee.addEventListener("submit", this.handleSubmitEmployee

    );
    const formAdmin = this.document.querySelector(
      `form[data-testid="form-admin"]`
    );
    formAdmin.addEventListener("submit", this.handleSubmitAdmin);
    ;
  }
  handleSubmitEmployee = e => {
    e.preventDefault()
    const user = {
      type: "Employee",
      email: e.target.querySelector(`input[data-testid="employee-email-input"]`).value,
      password: e.target.querySelector(`input[data-testid="employee-password-input"]`).value,
      status: "connected"
    }
    if (user.email != "admin@test.tld" && user.email != "employee@test.tld") {
      alert("Veillez entrer les paramètres de conncexions valides")
      return
    }else if(user.password !="admin" && user.password !="employee"){
      alert("veillez utiliser des informatrions de connections valides")
    }else if((user.email =="employee@test.tld" && user.password=="admin")||(user.email =="admin@test.tld" && user.password=="employee")){
      alert("utilisateur incorrect!")
      return
    }
    this.localStorage.setItem("user", JSON.stringify(user))
    
    this.login(user)
      // .catch(
      //   (err) => this.createUser(user)
      // )
      .then(() => {
        this.onNavigate(ROUTES_PATH['Bills'])
        this.PREVIOUS_LOCATION = ROUTES_PATH['Bills']
        PREVIOUS_LOCATION = this.PREVIOUS_LOCATION
        this.document.body.style.backgroundColor = "#fff"
      })
  }

  handleSubmitAdmin = (e) => {
    e.preventDefault();
    const user = {
      type: "Admin",
      email: e.target.querySelector(`input[data-testid="admin-email-input"]`)
        .value,
      password: e.target.querySelector(
        `input[data-testid="admin-password-input"]`
      ).value,
      status: "connected",
    };
    if (user.password != "admin") {
      alert("rwon user");
      return
    } else if(user.email !="admin@test.tld") {
      alert("paramètres de connections incorrectes")
      return
    }
    else {
      this.localStorage.setItem("user", JSON.stringify(user));
      this.login(user)
        .then(() => {
          this.onNavigate(ROUTES_PATH["Dashboard"]);
          this.PREVIOUS_LOCATION = ROUTES_PATH["Dashboard"];
          PREVIOUS_LOCATION = this.PREVIOUS_LOCATION;
          document.body.style.backgroundColor = "#fff";
        });
    }
  };

  login = (user) => {
    if (this.store) {
      return this.store
        .login(
          JSON.stringify({
            email: user.email,
            password: user.password,
          })
        )
        .then(({ jwt }) => {
          localStorage.setItem("jwt", jwt);
        });
    } else {
      return null;
    }
  };

  createUser = (user) => {
    if (this.store) {
      return this.store
        .users()
        .create({
          data: JSON.stringify({
            type: user.type,
            name: user.email.split("@")[0],
            email: user.email,
            password: user.password,
          }),
        })
        .then(() => {
          console.log(`User with ${user.email} is created`);
          return this.login(user);
        });
    }
     else
    {
      return null;
    }
  };

}


