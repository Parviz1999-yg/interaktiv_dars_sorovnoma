function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    const data = JSON.parse(e.postData.contents);

    sheet.appendRow([
      data.id || "",
      data.sana_vaqt || "",
      data.muassasa || "",
      data.yonalis || "",
      data.tajriba || "",
      data.platformalar || "",
      data.tayyorlash_vaqti || "",
      data.test_vaqti || "",
      data.muammolar || "",
      data.ozgarish_talabi || "",
      data.yetishmayotgan_imkoniyat || "",
      data.ai_bahosi || "",
      data.muhim_funksiya || "",
      data.platformaga_qiziqish || "",
      data.beta_sinov || "",
      data.narx || "",
      data.beta_aloqa || ""
    ]);

    try {
      updateStatistics_();
    } catch (statsError) {
      console.error("Statistika yangilanmadi:", statsError);
    }

    return jsonResponse_({ success: true });

  } catch (error) {
    return jsonResponse_({
      success: false,
      error: error.toString()
    });
  }
}

function doGet(e) {
  const action = e && e.parameter ? e.parameter.action : "";

  if (action === "stats") {
    const data = getStatistics_();
    const callback = e.parameter.callback;

    if (callback) {
      return ContentService
        .createTextOutput(callback + "(" + JSON.stringify(data) + ")")
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }

    return jsonResponse_(data);
  }

  return jsonResponse_({
    success: true,
    service: "interaktiv_dars_sorovnoma",
    message: "Survey API ishlayapti."
  });
}

function updateStatistics_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const source = ss.getSheets()[0];

  let stats = ss.getSheetByName("Statistika");
  if (!stats) {
    stats = ss.insertSheet("Statistika");
  }

  stats.clear();
  stats.clearConditionalFormatRules();
  stats.getCharts().forEach(chart => stats.removeChart(chart));

  const data = getStatistics_();

  stats.getRange("A1:C1").merge();
  stats.getRange("A1").setValue("INTERAKTIV DARS — SO‘ROVNOMA STATISTIKASI");
  stats.getRange("A1").setFontSize(16).setFontWeight("bold");

  stats.getRange("A2:C5").setValues([
    ["Ko‘rsatkich", "Qiymat", "Izoh"],
    ["Jami respondentlar", data.total, "Yaroqli javoblar soni"],
    ["AI ni foydali deb baholaganlar", data.summary.ai_positive_pct + "%", "Juda foydali + Foydali"],
    ["Beta-testga qiziqish", data.summary.beta_interest_pct + "%", "Ha + Balki"]
  ]);
  stats.getRange("A2:C2").setFontWeight("bold");

  let row = 7;
  const chartRanges = {};

  const sections = [
    ["muassasa", "Muassasa turi"],
    ["yonalis", "Yo‘nalish"],
    ["tajriba", "Pedagogik tajriba"],
    ["platformalar", "Raqamli vositalar"],
    ["tayyorlash_vaqti", "Dars materialini tayyorlash vaqti"],
    ["test_vaqti", "Test tayyorlash vaqti"],
    ["muammolar", "Interaktiv dars muammolari"],
    ["ai_bahosi", "AI yordamida dars yaratish"],
    ["muhim_funksiya", "Eng muhim funksiya"],
    ["platformaga_qiziqish", "Platformaga qiziqish"],
    ["beta_sinov", "Beta-testga tayyorlik"],
    ["narx", "Maqbul oylik narx"]
  ];

  sections.forEach(([key, title]) => {
    const values = data.sections[key] || [];

    stats.getRange(row, 1, 1, 3).merge();
    stats.getRange(row, 1).setValue(title);
    stats.getRange(row, 1).setFontWeight("bold").setFontSize(13);

    stats.getRange(row + 1, 1, 1, 3).setValues([["Variant", "Soni", "Foiz"]]);
    stats.getRange(row + 1, 1, 1, 3).setFontWeight("bold");

    if (values.length) {
      stats.getRange(row + 2, 1, values.length, 3).setValues(
        values.map(item => [item.label, item.count, item.pct + "%"])
      );
      chartRanges[key] = stats.getRange(row + 1, 1, values.length + 1, 2);
      row += values.length + 4;
    } else {
      row += 4;
    }
  });

  stats.getRange(row, 1, 1, 3).merge();
  stats.getRange(row, 1).setValue("Ochiq javoblar va aloqa");
  stats.getRange(row, 1).setFontWeight("bold").setFontSize(13);
  stats.getRange(row + 1, 1, 4, 3).setValues([
    ["Ko‘rsatkich", "Soni", "Izoh"],
    ["Platformadagi o‘zgarish bo‘yicha javoblar", data.open_answers.ozgarish_talabi, "Q8"],
    ["Yetishmayotgan imkoniyat bo‘yicha javoblar", data.open_answers.yetishmayotgan_imkoniyat, "Q9"],
    ["Aloqa qoldirganlar", data.summary.contacts, "Telegram yoki telefon"]
  ]);
  stats.getRange(row + 1, 1, 1, 3).setFontWeight("bold");

  stats.setFrozenRows(2);
  stats.autoResizeColumns(1, 3);
  stats.setColumnWidth(1, 430);
  stats.setColumnWidth(2, 100);
  stats.setColumnWidth(3, 100);

  addChart_(stats, chartRanges.ai_bahosi, 5, 2, "AI bahosi");
  addChart_(stats, chartRanges.platformaga_qiziqish, 5, 20, "Platformaga qiziqish");
  addChart_(stats, chartRanges.beta_sinov, 5, 38, "Beta-test");
  addChart_(stats, chartRanges.narx, 5, 56, "Maqbul narx");

  stats.getRange("A1:C" + Math.max(row + 4, 10)).setVerticalAlignment("middle");
}

function getStatistics_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  const values = sheet.getDataRange().getValues();

  if (values.length < 2) {
    return emptyStatistics_();
  }

  const headers = values[0].map(String);
  const rows = values.slice(1).filter(row => row.some(cell => String(cell).trim() !== ""));
  const index = {};
  headers.forEach((header, i) => index[header] = i);

  const get = (row, header) => {
    const i = index[header];
    return i === undefined ? "" : String(row[i] == null ? "" : row[i]).trim();
  };

  const total = rows.length;

  const definitions = {
    muassasa: "Muassasa",
    yonalis: "Yonalis",
    tajriba: "Tajriba",
    platformalar: "Platformalar",
    tayyorlash_vaqti: "Tayyorlash_vaqti",
    test_vaqti: "Test_vaqti",
    muammolar: "Muammolar",
    ai_bahosi: "AI_bahosi",
    muhim_funksiya: "Muhim_funksiya",
    platformaga_qiziqish: "Platformaga_qiziqish",
    beta_sinov: "Beta_sinov",
    narx: "Narx"
  };

  const sections = {};
  Object.keys(definitions).forEach(key => {
    sections[key] = countValues_(
      rows.map(row => get(row, definitions[key])),
      total,
      key === "platformalar" || key === "muammolar"
    );
  });

  const aiPositive = rows.filter(row => {
    const v = get(row, "AI_bahosi");
    return v === "Juda foydali" || v === "Foydali";
  }).length;

  const betaInterest = rows.filter(row => {
    const v = get(row, "Beta_sinov");
    return v === "Ha" || v === "Balki";
  }).length;

  const contacts = rows.filter(row => get(row, "Beta_aloqa") !== "").length;

  return {
    success: true,
    total: total,
    updated_at: new Date().toISOString(),
    summary: {
      ai_positive: aiPositive,
      ai_positive_pct: pct_(aiPositive, total),
      beta_interest: betaInterest,
      beta_interest_pct: pct_(betaInterest, total),
      contacts: contacts,
      contacts_pct: pct_(contacts, total)
    },
    sections: sections,
    open_answers: {
      ozgarish_talabi: rows.filter(row => get(row, "Ozgarish_talabi") !== "").length,
      yetishmayotgan_imkoniyat: rows.filter(row => get(row, "Yetishmayotgan_imkoniyat") !== "").length
    }
  };
}

function countValues_(values, total, splitComma) {
  const counts = {};

  values.forEach(value => {
    if (!value) return;

    const parts = splitComma
      ? value.split(",").map(v => v.trim()).filter(Boolean)
      : [value];

    parts.forEach(part => {
      counts[part] = (counts[part] || 0) + 1;
    });
  });

  return Object.keys(counts)
    .map(label => ({
      label: label,
      count: counts[label],
      pct: pct_(counts[label], total)
    }))
    .sort((a, b) => b.count - a.count);
}

function pct_(count, total) {
  if (!total) return 0;
  return Math.round((count / total) * 1000) / 10;
}

function emptyStatistics_() {
  return {
    success: true,
    total: 0,
    updated_at: new Date().toISOString(),
    summary: {
      ai_positive: 0,
      ai_positive_pct: 0,
      beta_interest: 0,
      beta_interest_pct: 0,
      contacts: 0,
      contacts_pct: 0
    },
    sections: {},
    open_answers: {
      ozgarish_talabi: 0,
      yetishmayotgan_imkoniyat: 0
    }
  };
}

function addChart_(sheet, range, column, row, title) {
  if (!range) return;

  const chart = sheet.newChart()
    .setChartType(Charts.ChartType.BAR)
    .addRange(range)
    .setOption("title", title)
    .setOption("legend", { position: "none" })
    .setOption("height", 280)
    .setOption("width", 520)
    .setPosition(row, column, 0, 0)
    .build();

  sheet.insertChart(chart);
}

function jsonResponse_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}