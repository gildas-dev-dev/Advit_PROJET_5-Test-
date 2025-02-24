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

  describe("When I fill fields with correct Employee credentials and submit", () => {
    test("Then It should log in the user and navigate to Bills", async () => {
      screen.getByTestId("employee-email-input").value = "employee@test.tld";
      screen.getByTestId("employee-password-input").value = "employee";
      const form = screen.getByTestId("form-employee");
      fireEvent.submit(form);
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
      const form = screen.getByTestId("form-admin");
      fireEvent.submit(form);
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
});

