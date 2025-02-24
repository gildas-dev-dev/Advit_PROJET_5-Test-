/**
 * @jest-environment jsdom
 */

import LoginUI from "../views/LoginUI";
import Login from "../containers/Login.js";
import { ROUTES_PATH } from "../constants/routes";
import { fireEvent, screen } from "@testing-library/dom";

describe("Given that I am a user on login page", () => {
  let login;
  let onNavigate;
  let localStorageMock;
  let storeMock;

  beforeEach(() => {
    document.body.innerHTML = LoginUI();
    localStorageMock = {
      getItem: jest.fn(() => null),
      setItem: jest.fn(),
    };
    storeMock = {
      login: jest.fn(() => Promise.resolve({ jwt: "12345" })),
      users: jest.fn(() => ({ create: jest.fn(() => Promise.resolve()) })),
    };
    onNavigate = jest.fn();
    login = new Login({
      document,
      localStorage: localStorageMock,
      onNavigate,
      PREVIOUS_LOCATION: "",
      store: storeMock,
    });
    
  });

  describe("When I do not fill fields and I click on employee button Login In", () => {
    test("Then It should render Login page and not authenticate", () => {
      const form = screen.getByTestId("form-employee");
      const handleSubmit = jest.fn(login.handleSubmitEmployee);
      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form);
      expect(handleSubmit).toHaveBeenCalled();
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
  });

  describe("When I fill fields with incorrect credentials and submit", () => {
    test("Then It should show an alert", () => {
      jest.spyOn(window, "alert").mockImplementation(() => {});
      screen.getByTestId("employee-email-input").value = "wrong@test.tld";
      screen.getByTestId("employee-password-input").value = "wrongpass";
      const form = screen.getByTestId("form-employee");
      fireEvent.submit(form);
      expect(window.alert).toHaveBeenCalledWith("Veillez entrer les paramètres de conncexions valides");
    });
  });

  describe("When an Employee enters a correct email but wrong password", () => {
    test("Then It should show an alert for incorrect password", () => {
      jest.spyOn(window, "alert").mockImplementation(() => {});
      screen.getByTestId("employee-email-input").value = "employee@test.tld";
      screen.getByTestId("employee-password-input").value = "wrongpass";
      fireEvent.submit(screen.getByTestId("form-employee"));
      expect(window.alert).toHaveBeenCalledWith("veillez utiliser des informatrions de connections valides");
    });
  });

  describe("When an Employee or Admin enters mismatched credentials", () => {
    test("Then It should show an alert for incorrect user", () => {
      jest.spyOn(window, "alert").mockImplementation(() => {});
      
      // Cas où un employé utilise le mot de passe d'admin
      screen.getByTestId("employee-email-input").value = "employee@test.tld";
      screen.getByTestId("employee-password-input").value = "admin";
      fireEvent.submit(screen.getByTestId("form-employee"));
      expect(window.alert).toHaveBeenCalledWith("utilisateur incorrect!");

      // Réinitialisation de l'espion sur l'alerte
      window.alert.mockClear();

      // Cas où un admin utilise le mot de passe d'employé
      screen.getByTestId("employee-email-input").value = "admin@test.tld";
      screen.getByTestId("employee-password-input").value = "employee";
      fireEvent.submit(screen.getByTestId("form-employee"));
      expect(window.alert).toHaveBeenCalledWith("utilisateur incorrect!");
    });
  });

  describe("When an Admin enters a wrong password", () => {
    test("Then It should show an alert with 'rwon user'", () => {
      jest.spyOn(window, "alert").mockImplementation(() => {});
      screen.getByTestId("admin-email-input").value = "admin@test.tld";
      screen.getByTestId("admin-password-input").value = "wrongpass";
      fireEvent.submit(screen.getByTestId("form-admin"));
      expect(window.alert).toHaveBeenCalledWith("rwon user");
    });
  });

  describe("When an Admin enters a wrong email", () => {
    test("Then It should show an alert with 'paramètres de connections incorrectes'", () => {
      jest.spyOn(window, "alert").mockImplementation(() => {});
      screen.getByTestId("admin-email-input").value = "wrong@test.tld";
      screen.getByTestId("admin-password-input").value = "admin";
      fireEvent.submit(screen.getByTestId("form-admin"));
      expect(window.alert).toHaveBeenCalledWith("paramètres de connections incorrectes");
    });
  });

  describe("When I fill fields with correct Employee credentials and submit", () => {
    test("Then It should log in the user and navigate to Bills", async () => {
      screen.getByTestId("employee-email-input").value = "employee@test.tld";
      screen.getByTestId("employee-password-input").value = "employee";
      fireEvent.submit(screen.getByTestId("form-employee"));
      await new Promise(process.nextTick);
      expect(localStorageMock.setItem).toHaveBeenCalledWith("user", JSON.stringify({
        type: "Employee",
        email: "employee@test.tld",
        password: "employee",
        status: "connected",
      }));
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH.Bills);
    });
  });

  describe("When I fill fields with correct Admin credentials and submit", () => {
    test("Then It should log in the user and navigate to Dashboard", async () => {
      screen.getByTestId("admin-email-input").value = "admin@test.tld";
      screen.getByTestId("admin-password-input").value = "admin";
      fireEvent.submit(screen.getByTestId("form-admin"));
      await new Promise(process.nextTick);
      expect(localStorageMock.setItem).toHaveBeenCalledWith("user", JSON.stringify({
        type: "Admin",
        email: "admin@test.tld",
        password: "admin",
        status: "connected",
      }));
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH.Dashboard);
    });
  });
 
describe("When I try to create a new user", () => {
  test("Then it should create the user and log them in", async () => {
    const user = { type: "admin", email: "admin@test.tld", password: "admin" };

    // Appel de createUser
    await login.createUser(user);

    // Vérification que create a bien été appelé avec les bonnes données
    expect(storeMock.users().create).toHaveBeenCalledWith({
      data: JSON.stringify({
        type: "admin",
        name: "admin", 
        email: "admin@test.tld",
        password: "admin",
      }),
    });

    // Vérification que login a été appelé après la création de l'utilisateur
    expect(login.login).toHaveBeenCalledWith(user);

    // Vérification que l'utilisateur est bien stocké dans le localStorage
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "user",
      JSON.stringify({
        type: "admin",
        email: "admin@test.tld",
        password: "admin",
        status: "connected",
      })
    );

    // Vérification que la navigation a eu lieu
    expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH.Dashboard);
  });
});
describe("Given that the store is not provided", () => {
  test("Then it should return null", async () => {
    // Créez une instance de Login sans passer d'objet store
    const login = new Login({
      document,
      localStorage: localStorageMock,
      onNavigate,
      PREVIOUS_LOCATION: "",
      store: null, 

      
    });

    const user = { type: "admin", email: "admin@test.tld", password: "admin" };

    // Appelez createUser
    const result = await login.createUser(user);

    // Vérifiez que la méthode renvoie bien null
    expect(result).toBeNull();
  });
});

});












