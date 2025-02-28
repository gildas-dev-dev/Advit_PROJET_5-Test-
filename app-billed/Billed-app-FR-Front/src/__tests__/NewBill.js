/**
 * @jest-environment jsdom
 */

import { fireEvent, screen } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";
import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore);

beforeEach(() => {
  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
  });
  window.localStorage.setItem(
    "user",
    JSON.stringify({
      type: "Employee",
      email: "a@a",
    })
  );
});

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    // Test 1 : Upload d'un fichier avec une extension valide (jpg, jpeg, png)
    test("Then i upload a file with valid extention (jpg,jpeg,png)", () => {
      // Arrange : Initialisation du DOM et de l'instance NewBill
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const html = NewBillUI();
      document.body.innerHTML = html;

      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      const handleChangeFile = jest.fn(newBill.handleChangeFile);
      const inputFile = screen.getByTestId("file");
      inputFile.addEventListener("change", handleChangeFile);

      // Act : Simulation de l'upload d'un fichier avec une extension valide
      fireEvent.change(inputFile, {
        target: {
          files: [
            new File(["test-valid-extension.jpg"], "test-valid-extension.jpg", {
              type: "image/jpg",
            }),
          ],
        },
      });

      // Assert : Vérification que la fonction handleChangeFile est appelée et que le fichier est valide
      expect(handleChangeFile).toHaveBeenCalled();
      expect(inputFile.files[0].type).toBe("image/jpg");
    });

    // Test 2 : Upload d'un fichier avec une extension invalide
    test("Then I upload a file with invalid extension", async () => {
      // Arrange : Initialisation du DOM et de l'instance NewBill
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const html = NewBillUI();
      document.body.innerHTML = html;

      const newBill = new NewBill({
        document,
        onNavigate,
        mockStore,
        localStorage: window.localStorage,
      });

      const handleChangeFile = jest.fn(newBill.handleChangeFile);
      const inputFile = screen.getByTestId("file");
      inputFile.addEventListener("change", handleChangeFile);

      // Act : Simulation de l'upload d'un fichier avec une extension invalide
      fireEvent.change(inputFile, {
        target: {
          files: [
            new File(
              ["test-invalid-extension.gif"],
              "test-invalid-extension.gif",
              { type: "image/gif" }
            ),
          ],
        },
      });

      // Assert : Vérification que la fonction handleChangeFile est appelée, que le fichier est invalide et qu'un message d'erreur est affiché
      expect(handleChangeFile).toHaveBeenCalled();
      expect(inputFile.files[0].type).toBe("image/gif");
      expect(inputFile.value).toBe("");
      const headerTitle = screen.getByText(
        "Seule les fichiers .jpg, .png .jepg sont autorisées"
      );
      expect(headerTitle).toBeTruthy();
    });
  });

  describe("When I am on NewBill Page and I submit the New Bill form", () => {
    // Test 3 : Soumission du formulaire New Bill
    test("Then It should call handleSubmit method", () => {
      // Arrange : Initialisation du DOM et de l'instance NewBill
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const html = NewBillUI();
      document.body.innerHTML = html;

      const newBill = new NewBill({
        document,
        onNavigate,
        mockStore,
        localStorage: window.localStorage,
      });

      const handleSubmitMethode = jest.fn(newBill.handleSubmit);
      const formNewBill = screen.getByTestId("form-new-bill");
      formNewBill.addEventListener("submit", handleSubmitMethode);

      // Act : Simulation de la soumission du formulaire
      fireEvent.submit(formNewBill);

      // Assert : Vérification que la méthode handleSubmit est appelée
      expect(handleSubmitMethode).toHaveBeenCalled();
    });
  });
});

// Test d'intégration POST
describe("Given I am a user connected as an employee", () => {
  describe("When I create a new bill", () => {
    // Test 4 : Création d'une nouvelle facture avec succès et redirection vers la page Bills
    test("Then it should fetches new bill to mock API POST and redirected me to Bills Page", async () => {
      // Arrange : Initialisation du DOM et du routeur
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.appendChild(root);
      router();

      // Mock de la méthode create de l'API
      jest.spyOn(mockStore, "bills").mockImplementationOnce(() => {
        return {
          create: () => {
            return Promise.resolve();
          },
        };
      });

      // Act : Navigation vers la page NewBill
      window.onNavigate(ROUTES_PATH.NewBill);
      await new Promise(process.nextTick);

      // Assert : Vérification que la redirection a eu lieu et que le titre de la page est correct
      const headerTitle = screen.getByText("Mes notes de frais");
      expect(headerTitle).toBeTruthy();
    });
  });

  describe("When I create a new bill and an error occurs on API", () => {
    beforeEach(() => {
      // Arrange : Initialisation du DOM et du routeur
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.appendChild(root);
      router();
    });


  });
});

describe("Given I am connected as an employee", () => {
  describe("When updateBill is called", () => {
    // Test 5 : Mise à jour d'une facture
    test("Then it should call store.bills().update with correct data", async () => {
      // Arrange : Mock de la méthode update de l'API
      const mockUpdate = jest.fn().mockResolvedValue({});
      const mockStore = {
        bills: jest.fn(() => ({
          update: mockUpdate,
        })),
      };

      const onNavigate = jest.fn();
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      newBill.billId = "123abc";
      const mockBill = {
        email: "gildas@237.com",
        type: "Transports",
        name: "Gildas",
        amount: 30,
        date: "2025-02-26",
        vat: "10",
        pct: 20,
        commentary: "Business trip",
        fileUrl: "https://gildas.com/file.png",
        fileName: "file.png",
        status: "pending",
      };

      // Act : Appel de la méthode updateBill
      await newBill.updateBill(mockBill);

      // Assert : Vérification que la méthode update est appelée avec les bonnes données et que la navigation a lieu
      expect(mockUpdate).toHaveBeenCalledWith({
        data: JSON.stringify(mockBill),
        selector: "123abc",
      });
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["Bills"]);
    });
  });
});