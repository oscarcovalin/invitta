/**
 * studio-admin-planes.js
 * Panel interno para operadores de Invitta: Administración de Planes, Créditos y Ledger.
 */

(function () {
  "use strict";

  const REASON_LABELS = {
    beta_courtesy: "Cortesía Beta",
    wire_transfer: "Pago por transferencia",
    support_fix: "Compensación / Soporte",
    demo: "Demostración / Pruebas",
    other: "Otro motivo"
  };

  function formatDate(isoString) {
    if (!isoString) return "-";
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" });
  }

  function shortId(id) {
    if (!id) return "";
    const str = String(id);
    return str.length > 8 ? str.slice(0, 8) + "..." : str;
  }

  document.addEventListener("DOMContentLoaded", async () => {
    // 1. Validar sesión
    const session = await window.studioAuth.requireSession();
    if (!session) return;

    const db = window.studioAuth.db;

    // Elementos DOM principales
    const accessDeniedSection = document.getElementById("access-denied-section");
    const adminContentSection = document.getElementById("admin-content-section");
    const searchInput = document.getElementById("search-studios-input");
    const totalStudiosCount = document.getElementById("total-studios-count");
    const studiosLoadingMsg = document.getElementById("studios-loading-msg");
    const studiosEmptyMsg = document.getElementById("studios-empty-msg");
    const studiosTableWrapper = document.getElementById("studios-table-wrapper");
    const studiosTableBody = document.getElementById("studios-table-body");
    const refreshBtn = document.getElementById("refresh-studios-btn");
    const toastMsg = document.getElementById("admin-toast-msg");
    const logoutBtn = document.getElementById("admin-logout-btn");

    // Modal Recarga
    const rechargeModal = document.getElementById("recharge-modal");
    const rechargeForm = document.getElementById("recharge-form");
    const rechargeTargetName = document.getElementById("recharge-target-name");
    const rechargeAmountInput = document.getElementById("recharge-amount-input");
    const rechargeReasonSelect = document.getElementById("recharge-reason-select");
    const rechargeNoteInput = document.getElementById("recharge-note-input");
    const rechargeErrorMsg = document.getElementById("recharge-error-msg");
    const closeRechargeModalBtn = document.getElementById("close-recharge-modal-btn");
    const cancelRechargeBtn = document.getElementById("cancel-recharge-btn");
    const submitRechargeBtn = document.getElementById("submit-recharge-btn");
    const quickAmountBtns = document.querySelectorAll(".quick-amount-btn");

    // Modal Ledger
    const ledgerModal = document.getElementById("ledger-modal");
    const ledgerTargetName = document.getElementById("ledger-target-name");
    const ledgerLoadingMsg = document.getElementById("ledger-loading-msg");
    const ledgerEmptyMsg = document.getElementById("ledger-empty-msg");
    const ledgerTableWrapper = document.getElementById("ledger-table-wrapper");
    const ledgerTableBody = document.getElementById("ledger-table-body");
    const closeLedgerModalBtn = document.getElementById("close-ledger-modal-btn");
    const dismissLedgerBtn = document.getElementById("dismiss-ledger-btn");

    // Estado local en memoria
    let allStudios = [];
    let activeRechargeStudio = null;
    let activeLedgerStudio = null;

    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        await window.studioAuth.logout();
      });
    }

    // 2. Validar que el usuario sea operador interno
    try {
      const { data: isOperator, error: roleError } = await db
        .rpc("is_invitta_sales_operator");

      if (roleError || !isOperator) {
        if (accessDeniedSection) accessDeniedSection.style.display = "block";
        if (adminContentSection) adminContentSection.style.display = "none";
        return;
      }
    } catch (err) {
      console.error("Error al validar rol de operador:", err);
      if (accessDeniedSection) accessDeniedSection.style.display = "block";
      if (adminContentSection) adminContentSection.style.display = "none";
      return;
    }

    // Usuario autorizado como operador
    if (accessDeniedSection) accessDeniedSection.style.display = "none";
    if (adminContentSection) adminContentSection.style.display = "block";

    // 3. Cargar estudios vía RPC segura
    async function loadStudiosList() {
      if (studiosLoadingMsg) studiosLoadingMsg.style.display = "block";
      if (studiosEmptyMsg) studiosEmptyMsg.style.display = "none";
      if (studiosTableWrapper) studiosTableWrapper.style.display = "none";

      try {
        const { data: studios, error } = await db.rpc("list_studio_credit_admin");

        if (error) {
          console.error("Error al listar estudios:", error);
          showToast("Error al cargar la lista de estudios.", true);
          if (studiosLoadingMsg) studiosLoadingMsg.style.display = "none";
          if (studiosEmptyMsg) studiosEmptyMsg.style.display = "block";
          return;
        }

        allStudios = Array.isArray(studios) ? studios : [];
        if (totalStudiosCount) totalStudiosCount.textContent = String(allStudios.length);
        renderStudios();
      } catch (err) {
        console.error("Fallo inesperado al consultar estudios:", err);
        showToast("Ocurrió un error al cargar los estudios.", true);
      } finally {
        if (studiosLoadingMsg) studiosLoadingMsg.style.display = "none";
      }
    }

    // 4. Renderizado seguro de tabla de estudios
    function renderStudios() {
      if (!studiosTableBody) return;
      studiosTableBody.replaceChildren();

      const query = (searchInput?.value || "").toLowerCase().trim();
      const filtered = allStudios.filter((s) => {
        if (!query) return true;
        const name = (s.name || "").toLowerCase();
        const id = (s.id || "").toLowerCase();
        const plan = (s.plan_tier || "").toLowerCase();
        return name.includes(query) || id.includes(query) || plan.includes(query);
      });

      if (filtered.length === 0) {
        if (studiosTableWrapper) studiosTableWrapper.style.display = "none";
        if (studiosEmptyMsg) studiosEmptyMsg.style.display = "block";
        return;
      }

      if (studiosEmptyMsg) studiosEmptyMsg.style.display = "none";
      if (studiosTableWrapper) studiosTableWrapper.style.display = "block";

      const fragment = document.createDocumentFragment();

      filtered.forEach((studio) => {
        const tr = document.createElement("tr");

        // Columna 1: Estudio (Nombre + ID corto)
        const tdStudio = document.createElement("td");
        const nameStrong = document.createElement("strong");
        nameStrong.textContent = studio.name || "Sin nombre";
        nameStrong.className = "studio-item-name";
        const idSub = document.createElement("span");
        idSub.textContent = "ID: " + shortId(studio.id);
        idSub.className = "studio-item-id";
        idSub.title = studio.id || "";
        tdStudio.append(nameStrong, idSub);

        // Columna 2: Plan
        const tdPlan = document.createElement("td");
        const planBadge = document.createElement("span");
        planBadge.className = "card-health-chip info";
        planBadge.textContent = studio.plan_tier || "beta";
        tdPlan.appendChild(planBadge);

        // Columna 3: Créditos Disponibles
        const tdAvailable = document.createElement("td");
        const availableCount = Number(studio.available_credits ?? 0);
        const availBadge = document.createElement("span");
        availBadge.className = "card-health-chip " + (availableCount > 2 ? "success" : availableCount > 0 ? "warning" : "danger");
        availBadge.textContent = String(availableCount);
        tdAvailable.appendChild(availBadge);

        // Columna 4: Créditos Usados
        const tdUsed = document.createElement("td");
        tdUsed.textContent = String(studio.used_credits ?? 0);

        // Columna 5: Fecha Registro
        const tdDate = document.createElement("td");
        tdDate.textContent = formatDate(studio.created_at);

        // Columna 6: Acciones
        const tdActions = document.createElement("td");
        tdActions.className = "admin-actions-cell";

        const rechargeBtn = document.createElement("button");
        rechargeBtn.type = "button";
        rechargeBtn.className = "btn-card btn-card-primary";
        rechargeBtn.textContent = "+ Recargar";
        rechargeBtn.addEventListener("click", () => openRechargeModal(studio));

        const historyBtn = document.createElement("button");
        historyBtn.type = "button";
        historyBtn.className = "btn-card btn-card-outline";
        historyBtn.textContent = "Historial";
        historyBtn.addEventListener("click", () => openLedgerModal(studio));

        tdActions.append(rechargeBtn, historyBtn);

        tr.append(tdStudio, tdPlan, tdAvailable, tdUsed, tdDate, tdActions);
        fragment.appendChild(tr);
      });

      studiosTableBody.appendChild(fragment);
    }

    // Buscador
    if (searchInput) {
      searchInput.addEventListener("input", () => renderStudios());
    }

    // Botón refrescar
    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => loadStudiosList());
    }

    // 5. Lógica del Modal de Recarga
    function openRechargeModal(studio) {
      activeRechargeStudio = studio;
      if (rechargeTargetName) {
        rechargeTargetName.textContent = `Estudio: ${studio.name || "Sin nombre"} (Saldo actual: ${studio.available_credits ?? 0} créditos)`;
      }
      if (rechargeAmountInput) rechargeAmountInput.value = "10";
      if (rechargeReasonSelect) rechargeReasonSelect.value = "beta_courtesy";
      if (rechargeNoteInput) rechargeNoteInput.value = "";
      if (rechargeErrorMsg) {
        rechargeErrorMsg.textContent = "";
        rechargeErrorMsg.style.display = "none";
      }
      if (submitRechargeBtn) {
        submitRechargeBtn.disabled = false;
        submitRechargeBtn.textContent = "Confirmar Recarga";
      }
      if (rechargeModal) rechargeModal.style.display = "flex";
    }

    function closeRechargeModal() {
      activeRechargeStudio = null;
      if (rechargeModal) rechargeModal.style.display = "none";
    }

    if (closeRechargeModalBtn) closeRechargeModalBtn.addEventListener("click", closeRechargeModal);
    if (cancelRechargeBtn) cancelRechargeBtn.addEventListener("click", closeRechargeModal);

    // Botones de monto rápido (+5, +10, +25, +50, +100)
    quickAmountBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const val = btn.getAttribute("data-val");
        if (val && rechargeAmountInput) {
          rechargeAmountInput.value = val;
        }
      });
    });

    if (rechargeForm) {
      rechargeForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!activeRechargeStudio?.id) return;

        const amount = parseInt(rechargeAmountInput?.value, 10);
        const reason = (rechargeReasonSelect?.value || "").trim();
        const note = (rechargeNoteInput?.value || "").trim();

        // Validaciones en cliente
        if (!amount || Number.isNaN(amount) || amount < 1) {
          showRechargeError("La cantidad debe ser al menos 1 crédito.");
          return;
        }
        if (amount > 500) {
          showRechargeError("La cantidad máxima permitida por operación es de 500 créditos.");
          return;
        }
        if (!reason) {
          showRechargeError("Debes seleccionar un motivo para la recarga.");
          return;
        }

        if (rechargeErrorMsg) rechargeErrorMsg.style.display = "none";
        if (submitRechargeBtn) {
          submitRechargeBtn.disabled = true;
          submitRechargeBtn.textContent = "Procesando...";
        }

        try {
          // Invocación a RPC segura
          const { data, error } = await db.rpc("grant_studio_credits", {
            target_studio_id: activeRechargeStudio.id,
            amount: amount,
            reason: reason,
            note: note || null
          });

          if (error) {
            console.error("Error en grant_studio_credits:", error);
            const friendlyMsg = error.message?.includes("INVITTA_UNAUTHORIZED_OPERATOR")
              ? "No tienes permisos de operador para realizar esta recarga."
              : error.message?.includes("INVITTA_AMOUNT_TOO_LARGE")
              ? "La cantidad excede el límite máximo de 500 créditos."
              : "No fue posible realizar la recarga. Intenta nuevamente.";
            showRechargeError(friendlyMsg);
            if (submitRechargeBtn) {
              submitRechargeBtn.disabled = false;
              submitRechargeBtn.textContent = "Confirmar Recarga";
            }
            return;
          }

          // Éxito
          const studioName = activeRechargeStudio.name || "Estudio";
          closeRechargeModal();
          showToast(`¡Recarga exitosa! Se añadieron ${amount} créditos a ${studioName}.`);

          // Recargar lista de estudios para reflejar el nuevo saldo
          await loadStudiosList();

          // Si el modal de ledger del mismo estudio estaba abierto, refrescarlo
          if (activeLedgerStudio?.id === activeRechargeStudio?.id) {
            await fetchAndRenderLedger(activeLedgerStudio.id);
          }
        } catch (err) {
          console.error("Error al procesar recarga:", err);
          showRechargeError("Ocurrió un error inesperado al conectar con el servidor.");
          if (submitRechargeBtn) {
            submitRechargeBtn.disabled = false;
            submitRechargeBtn.textContent = "Confirmar Recarga";
          }
        }
      });
    }

    function showRechargeError(msg) {
      if (rechargeErrorMsg) {
        rechargeErrorMsg.textContent = msg;
        rechargeErrorMsg.style.display = "block";
      }
    }

    // 6. Lógica del Modal de Historial (Ledger)
    async function openLedgerModal(studio) {
      activeLedgerStudio = studio;
      if (ledgerTargetName) {
        ledgerTargetName.textContent = `Estudio: ${studio.name || "Sin nombre"} (ID: ${shortId(studio.id)})`;
      }
      if (ledgerModal) ledgerModal.style.display = "flex";
      await fetchAndRenderLedger(studio.id);
    }

    function closeLedgerModal() {
      activeLedgerStudio = null;
      if (ledgerModal) ledgerModal.style.display = "none";
    }

    if (closeLedgerModalBtn) closeLedgerModalBtn.addEventListener("click", closeLedgerModal);
    if (dismissLedgerBtn) dismissLedgerBtn.addEventListener("click", closeLedgerModal);

    async function fetchAndRenderLedger(studioId) {
      if (ledgerLoadingMsg) ledgerLoadingMsg.style.display = "block";
      if (ledgerEmptyMsg) ledgerEmptyMsg.style.display = "none";
      if (ledgerTableWrapper) ledgerTableWrapper.style.display = "none";
      if (ledgerTableBody) ledgerTableBody.replaceChildren();

      try {
        const { data: records, error } = await db.rpc("list_studio_credit_ledger", {
          target_studio_id: studioId
        });

        if (error) {
          console.error("Error al consultar ledger:", error);
          if (ledgerEmptyMsg) {
            ledgerEmptyMsg.textContent = "No fue posible consultar el historial.";
            ledgerEmptyMsg.style.display = "block";
          }
          return;
        }

        const ledgerList = Array.isArray(records) ? records : [];
        if (ledgerList.length === 0) {
          if (ledgerEmptyMsg) {
            ledgerEmptyMsg.textContent = "No se encontraron movimientos registrados para este estudio.";
            ledgerEmptyMsg.style.display = "block";
          }
          return;
        }

        const fragment = document.createDocumentFragment();
        ledgerList.forEach((row) => {
          const tr = document.createElement("tr");

          // Fecha
          const tdDate = document.createElement("td");
          tdDate.textContent = formatDate(row.created_at);

          // Movimiento (+X)
          const tdDelta = document.createElement("td");
          const deltaBadge = document.createElement("span");
          deltaBadge.className = "card-health-chip success";
          deltaBadge.textContent = "+" + (row.delta_credits || 0);
          tdDelta.appendChild(deltaBadge);

          // Saldo Resultante
          const tdBalance = document.createElement("td");
          tdBalance.textContent = String(row.balance_after ?? "-");

          // Motivo
          const tdReason = document.createElement("td");
          tdReason.textContent = REASON_LABELS[row.reason] || row.reason || "-";

          // Notas
          const tdNote = document.createElement("td");
          tdNote.textContent = row.note || "-";

          // Operador
          const tdOp = document.createElement("td");
          tdOp.textContent = shortId(row.operator_user_id);
          tdOp.title = row.operator_user_id || "";

          tr.append(tdDate, tdDelta, tdBalance, tdReason, tdNote, tdOp);
          fragment.appendChild(tr);
        });

        if (ledgerTableBody) ledgerTableBody.appendChild(fragment);
        if (ledgerTableWrapper) ledgerTableWrapper.style.display = "block";
      } catch (err) {
        console.error("Fallo inesperado al consultar ledger:", err);
      } finally {
        if (ledgerLoadingMsg) ledgerLoadingMsg.style.display = "none";
      }
    }

    // 7. Feedback Toast
    let toastTimeout = null;
    function showToast(message, isError = false) {
      if (!toastMsg) return;
      if (toastTimeout) clearTimeout(toastTimeout);

      toastMsg.textContent = message;
      toastMsg.className = "admin-toast " + (isError ? "error" : "success");
      toastMsg.style.display = "block";

      toastTimeout = setTimeout(() => {
        toastMsg.style.display = "none";
      }, 4000);
    }

    // Carga inicial de datos
    await loadStudiosList();
  });
})();
