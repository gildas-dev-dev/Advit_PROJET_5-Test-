/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import BillsUI from "../views/BillsUI.js";
import Bills from "../containers/Bills.js";
import { bills } from "../fixtures/bills.js";
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
  describe("When I am on Bills Page", () => {
    // Test 1 : Récupération des factures depuis l'API
    test("Then, fetches bills from mock API GET", async () => {
      // Arrange (préparation)
      localStorage.setItem(
        "user",
        JSON.stringify({ type: "employee", email: "a@a" })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Dashboard);

      // Act (Action)
      await waitFor(() => screen.getByText("Validations"));
      const statutValide = await screen.getByText("En attente (1)");
      const statutRefuse = await screen.getByText("Refusé (2)");

      // Assert (Vérification)
      expect(statutValide).toBeTruthy();
      expect(statutRefuse).toBeTruthy();
      expect(screen.getByTestId("big-billed-icon")).toBeTruthy();
    });

    // Test 2 : Vérification de la mise en surbrillance de l'icône "Notes de frais"
    test("Then, bill icon in vertical layout should be highlighted", async () => {
      // Arrange (préparation)
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);

      // Act (Action)
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");

      // Assert (Vérification)
      expect(windowIcon.classList.contains("active-icon")).toBe(true);
    });

    // Test 3 : Vérification du tri des factures du plus ancien au plus récent
    test("Then, bills should be ordered from earliest to latest", () => {
      // Arrange (préparation)
      document.body.innerHTML = BillsUI({ data: bills });

      // Act (Action)
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a > b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);

      // Assert (Vérification)
      expect(dates).toEqual(datesSorted);
    });
  });
});

// Test 4 : Ouverture de la modale lors du clic sur l'icône "voir"
describe("When I am on Bills Page and I click on icon eye", () => {
  test("Then, a modal should open", () => {
    // Arrange (préparation)
    function onNavigate(pathname) {
      document.body.innerHTML = ROUTES({ pathname });
    }
    document.body.innerHTML = BillsUI({ data: bills });
    const toutesLesFactures = new Bills({
      document,
      onNavigate,
      store: null,
      bills: bills,
      localStorage: window.localStorage,
    });

    $.fn.modal = jest.fn();

    // Act (Action)
    const pemiereIcone = screen.getAllByTestId("icon-eye")[0];
    const handleClickIconEye = jest.fn(() =>
      toutesLesFactures.handleClickIconEye(pemiereIcone)
    );
    pemiereIcone.addEventListener("click", handleClickIconEye);
    userEvent.click(pemiereIcone);

    // Assert (Vérification)
    expect(handleClickIconEye).toHaveBeenCalled();
    const modal = screen.getByTestId("modaleFile");
    expect(modal).toBeTruthy();
  });
});

// Test 5 : Redirection vers le formulaire de création d'une nouvelle note de frais
describe("When I am on Bills Page and I click on the new bill button", () => {
  test("Then, I should be sent on the new bill page form", () => {
    // Arrange (préparation)
    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname });
    };

    document.body.innerHTML = BillsUI({ data: bills });

    const toutesLesFactures = new Bills({
      document,
      onNavigate,
      store: null,
      localStorageMock,
    });

    // Act (Action)
    const handleClickNewBill = jest.fn(() => toutesLesFactures.handleClickNewBill());

    const nouveauBoutonFacture = screen.getByTestId("btn-new-bill");
    nouveauBoutonFacture.addEventListener("click", handleClickNewBill);
    userEvent.click(nouveauBoutonFacture);

    // Assert (Vérification)
    expect(handleClickNewBill).toHaveBeenCalled();
    const formNewBill = screen.getByTestId("form-new-bill");
    expect(formNewBill).toBeTruthy();
  });
});

// Test d'intégration GET
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bills Page", () => {
    // Test 6 : Récupération des factures depuis l'API
    test("Then, fetches bills from mock API GET", async () => {
      // Arrange (préparation)
      const methodeSpy = jest.spyOn(mockStore, "bills");

      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();

      // Act (Action)
      window.onNavigate(ROUTES_PATH.Bills);

      await waitFor(() => screen.getByText("Mes notes de frais"));

      // Assert (Vérification)
      const headerTitle = screen.getByText("Mes notes de frais");
      expect(headerTitle).toBeTruthy();

      expect(methodeSpy).toHaveBeenCalled();

      const toutesLesFacturesUI = screen.getAllByTestId("bill-list-item");
      expect(toutesLesFacturesUI.length).toEqual(4);
    });
  });

  describe("When I navigate to Bills Page and an error occurs on API", () => {
    beforeEach(() => {
      // Arrange (préparation)
      jest.spyOn(mockStore, "bills");
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.appendChild(root);
      router();
    });

    // Test 7 : Erreur lors de la récupération des factures depuis l'API
    test("Then, an error message should be displayed", async () => {
      // Arrange (préparation)
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 404"));
          },
        };
      });

      // Act (Action)
      window.onNavigate(ROUTES_PATH.Bills);

      // Assert (Vérification)
      await waitFor(() => screen.getByText(/Erreur 404/));
      const errorMessage = screen.getByText(/Erreur 404/);
      expect(errorMessage).toBeTruthy();
    });
  });
});



jest.mock("../app/format", () => ({
  formatDate: jest.fn((date) => {
    if (date === "corrupt") throw new Error("Invalid date format");
    return new Date(date).toLocaleDateString("fr-FR");
  }),
  formatStatus: jest.fn((status) => status),
}));

describe("Bills", () => {
  let storeMock;
  let billsInstance;

  beforeEach(() => {
    storeMock = {
      bills: () => ({
        list: jest.fn().mockResolvedValue([
          { id: 1, date: "2023-12-01", status: "pending" },
          // Déclenchera l'erreur
          { id: 2, date: "corrupt", status: "accepted" }, 
          { id: 3, date: "2024-02-01", status: "refused" },
        ]),
      }),
    };

    billsInstance = new Bills({ document: document, onNavigate: jest.fn(), store: storeMock, localStorage: window.localStorage });
  });

  test("should return bills with formatted dates, and handle corrupted data", async () => {
    // Mock console.log pour vérifier les erreurs
    console.log = jest.fn(); 

    const bills = await billsInstance.getBills();
    // Vérifie qu'on a bien 3 éléments
    expect(bills).toHaveLength(3); 

    // Vérifie que la première et la troisième facture ont une date formatée
    expect(bills[0].date).toMatch(/\d{2}\/\d{2}\/\d{4}/); 
    expect(bills[2].date).toMatch(/\d{2}\/\d{2}\/\d{4}/); 

    // Vérifie que la facture corrompue garde sa date brute
    expect(bills[1].date).toBe("corrupt");

    // Vérifie que le catch a bien loggé une erreur
    expect(console.log).toHaveBeenCalledWith(expect.any(Error), "for", expect.objectContaining({ id: 2 }));
  });

  test("should return undefined if store is not defined", async () => {
    const billsInstance = new Bills({ document: document, onNavigate: jest.fn(), store: null, localStorage: window.localStorage });
  
    const result = await billsInstance.getBills();
    // Vérifie que le retour de la fonction est undefined
    expect(result).toBeUndefined(); 
  });
  
});
