/**
 * 
 * затестить правильно ли работают оставшиеся дни:
 *  сделать инпут дата для теста
 * 
 */



let periods = [];
const MAX_BALANCE = 28;
const MAX_NEGATIVE_BALANCE = -5;


$(document).ready(() => {

    $("#employmentDate").attr("max", new Date().toISOString().slice(0, 10));

    if (localStorage.startPlanning){
        $("#employmentDate").val(localStorage.startPlanning);
    }

    $("#employmentDate").on("change", function () {
        localStorage.startPlanning = $(this).val();
    });
    
    if (localStorage.periods && JSON.parse(localStorage.periods).length > 0){
        periods = JSON.parse(localStorage.periods);
        $("#employmentDate").prop("disabled", true);
        $("#startPlanning").prop("disabled", true);
        $("#calculationSection").show();
        
        calculateBalance(employmentDate);
        updatePeriodsTable();
    }


    // Начало расчета
    $("#startPlanning").on("click", function () {
        const employmentDate = $("#employmentDate").val();

        if (!employmentDate || new Date(employmentDate) > new Date() || new Date(employmentDate) < new Date(2024, 0 ,1) ) {
            alert("Введите корректную дату трудоустройства!");
            return;
        }


        $("#employmentDate").prop("disabled", true);
        $(this).prop("disabled", true);
        $("#calculationSection").show();

        // Расчет баланса на конец года
        calculateBalance(employmentDate);
    });

    // Добавление периода
    $("#addPeriod").on("click", function () {
        const startDate = $("#startDate").val();
        const endDate = $("#endDate").val();

        // Валидация
        const errors = validatePeriod(startDate, endDate);
        if (errors.length > 0) {
            $("#errorMessages").html(errors.join("<br>"));
            return;
        }
        else {
            $("#errorMessages").empty();
        }

        const duration = calculateDuration(startDate, endDate);
        const availableBalance = calculateAvailableBalance(endDate);

        if (availableBalance - duration < MAX_NEGATIVE_BALANCE) {
            $("#errorMessages").html(
                `Не хватает баланса дней. Баланс: ${availableBalance}, нужно: ${duration}.`
            );
            return;
        }

        // Сохранение периода
        
        periods.push({ startDate, endDate, duration });
        localStorage.periods = JSON.stringify(periods);
        updatePeriodsTable();
    });

    // Очистка периодов
    $("#clearPeriods").on("click", function () {
        periods = [];
        localStorage.periods = JSON.stringify(periods);
        updatePeriodsTable();
        $("#employmentDate").prop("disabled", false).val("");
        $("#startPlanning").prop("disabled", false);
        $("#calculationSection").hide();
    });

    // Завершение планирования
    $("#finishPlanning").on("click", function () {
        const totalPlanned = calculateTotalPlanned();
        if (totalPlanned < MAX_BALANCE) {
            alert("Необходимо запланировать минимум 28 дней отпуска.");
            return;
        }

        alert("Поздравляем! Вы успешно запланировали свои отпуска.");
        $("#addPeriod, #startDate, #endDate").prop("disabled", true);
    });
});


function calculateBalance(employmentDate) {
    const start = new Date(employmentDate);
    let end = new Date();
    end = new Date(end.getFullYear() + 1, 11, 31 );
    const workedDays = Math.round((end - start) / (1000 * 60 * 60 * 24));
    const balance = (MAX_BALANCE / 365) * workedDays;
    $("#totalBalance").text(balance.toFixed(2));
}

function calculateDuration(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
}

function calculateAvailableBalance(date) {
    const employmentDate = $("#employmentDate").val();
    const workedDays = Math.round((new Date(date) - new Date(employmentDate)) / (1000 * 60 * 60 * 24));
    return Math.min(MAX_BALANCE, (MAX_BALANCE / 365) * workedDays) - calculateTotalPlanned();
}

function calculateTotalPlanned() {
    return periods.reduce((sum, period) => sum + period.duration, 0);
}

function updatePeriodsTable() {
    const tableBody = $("#vacationTable").empty();
    periods.forEach((period) => {
        tableBody.append(
            `<tr><td>${period.startDate}</td><td>${period.endDate}</td><td>${period.duration}</td></tr>`
        );
    });

    const totalPlanned = calculateTotalPlanned();
    $("#totalPlanned").text(totalPlanned);
    $("#remainingDays").text(Math.max(0, MAX_BALANCE - totalPlanned));
}

function validatePeriod(startDate, endDate) {
    const errors = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (!startDate || !endDate) {
        errors.push("Обе даты должны быть заполнены.");
    }

    if (end < start) {
        errors.push("Дата окончания отпуска не может быть раньше даты начала.");
    }


    const nextYear = new Date().getFullYear() + 1;
    if (start.getFullYear() != nextYear || end.getFullYear() != nextYear) {
        errors.push(`Планировать можно только в пределах ${nextYear.toString()} года`);
    }


    const overlaps = periods.some(
        (period) =>
            (start >= new Date(period.startDate) && start <= new Date(period.endDate)) ||
            (end >= new Date(period.startDate) && end <= new Date(period.endDate))
    );

    if (overlaps) {
        errors.push("Даты отпуска пересекаются с уже существующими.");
    }

    return errors;
}
