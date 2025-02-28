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
    // Arrange: Initialisation du DOM avec le formulaire de connexion 
    document.body.innerHTML = LoginUI();

    // Mock ou simulation du localStorage
    localStorageMock = {
      getItem: jest.fn(() => null),
      setItem: jest.fn(),
    };

    // Mock ou simulation du store ou API
    storeMock = {
      login: jest.fn(() => Promise.resolve({ jwt: "12345" })),
      users: jest.fn(() => ({
        create: jest.fn(() => Promise.resolve({})), 
      })),
    };

    // Mock ou simulation de la fonction de navigation
    onNavigate = jest.fn();

    // Initialisation de la classe Login avec les mocks
    login = new Login({
      document,
      localStorage: localStorageMock,
      onNavigate,
      PREVIOUS_LOCATION: "",
      store: storeMock,
    });
  });

  // Test 1 : Connexion sans remplir les champs
  describe("When I do not fill fields and I click on employee button Login In", () => {
    test("Then It should render Login page and not authenticate", () => {
      // Arrange: Récupération du formulaire
      const form = screen.getByTestId("form-employee");
      const handleSubmit = jest.fn(login.handleSubmitEmployee);
      form.addEventListener("submit", handleSubmit);

      // Act: Soumission du formulaire
      fireEvent.submit(form);

      // Assert: Vérification que la soumission a été traitée mais sans authentification
      expect(handleSubmit).toHaveBeenCalled();
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
  });

  // Test 2 : Connexion avec des identifiants incorrects
  describe("When I fill fields with incorrect credentials and submit", () => {
    test("Then It should show an alert", () => {
      // Arrange: Configuration des champs avec des identifiants incorrects
      jest.spyOn(window, "alert").mockImplementation(() => {});
      screen.getByTestId("employee-email-input").value = "wrong@test.tld";
      screen.getByTestId("employee-password-input").value = "wrongpass";
      const form = screen.getByTestId("form-employee");

      // Act: Soumission du formulaire
      fireEvent.submit(form);

      // Assert: Vérification que l'alerte a été affichée
      expect(window.alert).toHaveBeenCalledWith("Veillez entrer les paramètres de conncexions valides");
    });
  });

  // Test 3 : Connexion avec un email correct mais un mot de passe incorrect
  describe("When an Employee enters a correct email but wrong password", () => {
    test("Then It should show an alert for incorrect password", () => {
      // Arrange: Configuration des champs avec un email correct et un mot de passe incorrect
      jest.spyOn(window, "alert").mockImplementation(() => {});
      screen.getByTestId("employee-email-input").value = "employee@test.tld";
      screen.getByTestId("employee-password-input").value = "wrongpass";

      // Act: Soumission du formulaire
      fireEvent.submit(screen.getByTestId("form-employee"));

      // Assert: Vérification que l'alerte a été affichée
      expect(window.alert).toHaveBeenCalledWith("veillez utiliser des informatrions de connections valides");
    });
  });

  // Test 4 : Connexion avec des identifiants incompatibles
  describe("When an Employee or Admin enters mismatched credentials", () => {
    test("Then It should show an alert for incorrect user", () => {
      // Arrange: Configuration des champs avec des identifiants incompatibles
      jest.spyOn(window, "alert").mockImplementation(() => {});

      // Cas où un employé utilise le mot de passe d'admin
      screen.getByTestId("employee-email-input").value = "employee@test.tld";
      screen.getByTestId("employee-password-input").value = "admin";

      // Act: Soumission du formulaire
      fireEvent.submit(screen.getByTestId("form-employee"));

      // Assert: Vérification que l'alerte a été affichée
      expect(window.alert).toHaveBeenCalledWith("utilisateur incorrect!");

      // Réinitialisation de l'espion sur l'alerte
      window.alert.mockClear();

      // Cas où un admin utilise le mot de passe d'employé
      screen.getByTestId("employee-email-input").value = "admin@test.tld";
      screen.getByTestId("employee-password-input").value = "employee";

      // Act: Soumission du formulaire
      fireEvent.submit(screen.getByTestId("form-employee"));

      // Assert: Vérification que l'alerte a été affichée
      expect(window.alert).toHaveBeenCalledWith("utilisateur incorrect!");
    });
  });

  // Test 5 : Connexion Admin avec un mauvais mot de passe
  describe("When an Admin enters a wrong password", () => {
    test("Then It should show an alert with 'rwon user'", () => {
      // Arrange: Configuration des champs avec un mauvais mot de passe
      jest.spyOn(window, "alert").mockImplementation(() => {});
      screen.getByTestId("admin-email-input").value = "admin@test.tld";
      screen.getByTestId("admin-password-input").value = "wrongpass";

      // Act: Soumission du formulaire
      fireEvent.submit(screen.getByTestId("form-admin"));

      // Assert: Vérification que l'alerte a été affichée
      expect(window.alert).toHaveBeenCalledWith("rwon user");
    });
  });

  // Test 6 : Connexion Admin avec un mauvais email
  describe("When an Admin enters a wrong email", () => {
    test("Then It should show an alert with 'paramètres de connections incorrectes'", () => {
      // Arrange: Configuration des champs avec un mauvais email
      jest.spyOn(window, "alert").mockImplementation(() => {});
      screen.getByTestId("admin-email-input").value = "wrong@test.tld";
      screen.getByTestId("admin-password-input").value = "admin";

      // Act: Soumission du formulaire
      fireEvent.submit(screen.getByTestId("form-admin"));

      // Assert: Vérification que l'alerte a été affichée
      expect(window.alert).toHaveBeenCalledWith("paramètres de connections incorrectes");
    });
  });

  // Test 7 : Connexion réussie en tant qu'employé
  describe("When I fill fields with correct Employee credentials and submit", () => {
    test("Then It should log in the user and navigate to Bills", async () => {
      // Arrange: Configuration des champs avec des identifiants corrects
      screen.getByTestId("employee-email-input").value = "employee@test.tld";
      screen.getByTestId("employee-password-input").value = "employee";

      // Act: Soumission du formulaire
      fireEvent.submit(screen.getByTestId("form-employee"));
      // Attend que la promesse soit résolue
      await new Promise(process.nextTick); 

      // Assert: Vérification que l'utilisateur est connecté et redirigé vers le dashbord
      expect(localStorageMock.setItem).toHaveBeenCalledWith("user", JSON.stringify({
        type: "Employee",
        email: "employee@test.tld",
        password: "employee",
        status: "connected",
      }));
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH.Bills);
    });
  });

  // Test 8 : Connexion réussie en tant qu'admin
  describe("When I fill fields with correct Admin credentials and submit", () => {
    test("Then It should log in the user and navigate to Dashboard", async () => {
      // Arrange: Configuration des champs avec des identifiants corrects
      screen.getByTestId("admin-email-input").value = "admin@test.tld";
      screen.getByTestId("admin-password-input").value = "admin";

      // Act: Soumission du formulaire
      fireEvent.submit(screen.getByTestId("form-admin"));
      // Attend que la promesse soit résolue
      await new Promise(process.nextTick); 

      // Assert: Vérification que l'utilisateur est connecté et redirigé sur le dashbord
      expect(localStorageMock.setItem).toHaveBeenCalledWith("user", JSON.stringify({
        type: "Admin",
        email: "admin@test.tld",
        password: "admin",
        status: "connected",
      }));
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH.Dashboard);
    });
  });

  // Test 9 : Création d'un nouvel utilisateur
  describe("When I try to create a new user", () => {
    test("Then it should create the user and log them in", async () => {
      const user = { type: "admin", email: "admin@test.tld", password: "admin" };
    
      // résultat de createUser
      const result = await login.createUser(user);
    
      // Vérifie que la fonction storeMock.users().create a bien été appelée
      expect(storeMock.users().create).toHaveBeenCalledWith({
        data: JSON.stringify({
          type: "admin",
          name: "admin",
          email: "admin@test.tld",
          password: "admin",
        }),
      });
    
      // Vérifie que login a bien été appelé avec user
      expect(login.login).toHaveBeenCalledWith(user);
    
      // Vérifie que l'utilisateur est bien stocké dans localStorage
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "user",
        JSON.stringify({
          type: "admin",
          email: "admin@test.tld",
          password: "admin",
          status: "connected",
        })
      );
    
      // Vérifie que l'utilisateur est redirigé vers le Dashboard
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH.Dashboard);
    
      // Vérifie que result est bien une Promise 
      expect(result).toBeInstanceOf(Promise);
    });
    
  });

  // Test 10 : Store non fourni
  describe("Given that the store is not provided", () => {
    test("Then it should return null", async () => {
      // Arrange: Création d'une instance de Login sans store
      const login = new Login({
        document,
        localStorage: localStorageMock,
        onNavigate,
        PREVIOUS_LOCATION: "",
        store: null,
      });

      const user = { type: "admin", email: "admin@test.tld", password: "admin" };

      // Act: Appel de createUser
      const result = await login.createUser(user);

      // Assert: Vérification que la méthode renvoie null
      expect(result).toBeNull();
    });
  });

  // Test 11 : Store null
  describe("Given that the store is null", () => {
    test("Then it should return null and not attempt to login", async () => {
      // Arrange: Création d'une instance de Login avec store null
      const user = { email: "admin@test.tld", password: "admin" };
      const loginWithNoStore = new Login({
        document,
        localStorage: localStorageMock,
        onNavigate,
        PREVIOUS_LOCATION: "",
        store: null,
      });

      // Act: Appel de login
      const result = await loginWithNoStore.login(user);

      // Assert: Vérification que la méthode renvoie null et que les actions ne sont pas effectuées
      expect(result).toBeNull();
      expect(storeMock.login).not.toHaveBeenCalled();
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
  });
});

