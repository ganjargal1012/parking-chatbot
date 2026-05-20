const PARKING_NAMES = [
  "DRAGON-шунхлай",
  "DRAGON-сүлжмэл",
  "DRAGON-и март",
  "DRAGON-төв",
  "UB AUTOCOM - Дотор",
  "UB AUTOCOM - Төлбөртэй",
  "UB AUTOCOM Төлбөртэй 2",
  "Holiday inn-Гадаах зогсоол",
  "Holiday inn-Дотор зогсоол",
  "Хүүхдийн парк- Shangrila зогсоол",
  "Хүүхдийн парк- Зүүн зогсоол",
  "Хүүхдийн парк- Урд зогсоол",
  "Наадам центр- Наадам дотор зогсоол",
  "Наадам центр- Наадам номин урд зогсоол",
  "Наадам центр- Наадам Номин хажуу зогсоол",
  "Akoya mall- Akoya residence",
  "100 айл барилгачин",
  "100 айл нэгдсэн эмнэлэг",
  "100 айл орос кабель",
  "19 үйлчилгээний төв",
  "32 carrefour",
  "ARVIIJH_ERDENII_KHARSH",
  "Academic-1",
  "Academy-2",
  "Akoya mall",
  "Artsat luxury village",
  "Aurora",
  "BSB superstore",
  "BSB мебел",
  "Bluespot",
  "Buti town",
  "Carrefour supermarket /яармаг/",
  "Cedar city residence",
  "Central tower",
  "EMC Showroom",
  "Eco build mega store",
  "Edu park",
  "Efes supermarket 13",
  "GoTo market",
  "GoTo market-Дотор зогсоол",
  "Horse motors",
  "Hunnu Mall",
  "IC tower зогсоол",
  "INR - Home Plaza",
  "LS плаза",
  "MCS CoSpace",
  "MM property",
  "Metromall",
  "Mika",
  "Moffice",
  "Munh hudaldaanii tuv",
  "Novotel UB",
  "O'Resh хүнсний дэлгүүр",
  "One residence",
  "PG плаза",
  "Paradise plaza",
  "Peak",
  "Regis Place-Дотор",
  "Regis Place-Гадаа",
  "Romana residence",
  "Shurt",
  "Sila Center",
  "Smart Electronics",
  "Steppe arena",
  "Sydney Tower",
  "TARA CENTER",
  "Titan center",
  "Tuul View хотхон",
  "UB Tower",
  "UB-Taxi",
  "Unimed International Hospital",
  "Victory center",
  "Villa Verde хотхон",
  "Z business center",
  "Zaisan luxury village",
  "Zaisan square",
  "tokyo town 1",
  "АЗ молл",
  "АСА Арена",
  "Алтан жолоо-Дотор зогсоол",
  "Алтан жолоо-Гаднах зогсоол",
  "Амгалан зах-Зогсоол",
  "Амгалан зах-Ажилчид зогсоол",
  "Андууд",
  "Анун",
  "Ар Үр алтай",
  "Арвай вилла",
  "БАРМАШ ХХК",
  "БЗД ЗДТГ",
  "Барилгачдын талбай",
  "Баянгол зочид буудал",
  "Баянзүрх эмнэлэг",
  "Баянмонгол төлбөртэй",
  "Баянмонгол хотхон",
  "Бишрэлт, капитал банк",
  "Блүмон, зүүн зогсоол",
  "Бордер, замын үүд",
  "Боса ХҮТ",
  "Галлериа Улаанбаатар",
  "Гэгээнтэн урд",
  "Гэгээнтэн хойд",
  "Дархан ОУХ төв",
  "Дельта авто сервис",
  "Ди Жи Ти Зэт",
  "Jetro",
  "Зайсан 47",
  "Зүүн 4 зам",
  "Имарт соло",
  "Интермед",
  "Их Монгол Төв",
  "Их Монгол ресторан",
  "Их хуралдай",
  "Кайду худалдааны төв",
  "М-Си-Эс плаза",
  "Мандала 360-365 garage",
  "Мандала 360-360 garage",
  "Мандала 360-Зогсоол",
  "Мандала гарден-Гарааш",
  "Мандала гарден-Зогсоол",
  "Мандала гарден-Watergarden garage",
  "Мандала хотхон-Төлбөртэй зогсоол",
  "Мандала хотхон-Зогсоол",
  "Мандах өргөө СӨХ",
  "Маргад",
  "Монгол эм импекс",
  "Морьтон цогцолбор",
  "МҮИС",
  "Мөнх хөхий 16",
  "Мөнххада",
  "НИК зогсоол",
  "Наадам клуб",
  "Наран плаза",
  "Нарт хотхон",
  "Нийслэлийн Өргөө Амаржих Газар",
  "Нисдэг машин-Граж зогсоол",
  "Нисдэг машин-Зогсоол",
  "Номадс ресторан",
  "Оргил 21",
  "Орчлон сургууль-Зогсоол",
  "Орчлон сургууль-Цэцэрлэгийн зогсоол",
  "Орчлон сургууль-Teachers",
  "Парк Плейс",
  "Сансар Имарт зүүн хойно",
  "Саруул төв",
  "Скайтел зогсоол",
  "Сонгдо эмнэлэг",
  "Сонгинохайрхан дүүрэг",
  "Соёлын төв өргөө",
  "Соёмбо тауэр",
  "Спортын ордон",
  "Сутайн буянт",
  "Сэлбэ Апартмент",
  "Сүнжин гранд",
  "Таванбогд-19",
  "Техник импорт",
  "Токио таун молл",
  "Туушин зочид буудал",
  "Түрэлт ХХК",
  "Улаанбаатар их дэлгүүр",
  "Хан Хилсс Хотхон",
  "Хангарди хотхон",
  "Хард рок кафе",
  "Хархорин плаза",
  "Хуульчдын ордон",
  "Хүүшийн ам",
  "ХӨСҮТ",
  "Цирк автотээвэр",
  "Цэнгэлдэх баруун",
  "Цэнгэлдэх сурын харваа",
  "Цэнгэлдэх урд",
  "Цэнгэлдэх хойд",
  "Цэнгэлдэх шагай харваа",
  "Чандмань",
  "Чингис хаан музей",
  "Чингэлтэй дүүрэг",
  "Чойжин лам сүм",
  "Шилэн пирамид СӨХ",
  "Шүүхийн шийдвэр урд",
  "Энхтайван гүүр баруун урд",
  "Энэрмед",
  "Эрдэнэс таван толгой",
  "Эх нялхас",
  "ҮЦХ хойд баруун тал- Ажилтан",
  "ҮЦХ хойд баруун тал- Баруун",
  "ҮЦХ хойд баруун тал- Оффис",
  "ҮЦХ хойд зүүн тал",
  "Үндэсний номын сан",
  "Өндөр цахир, цайз",
  "Зхут",
  "Монгол японы эмнэлэг",
  "Нисэх номин",
  "Novotel киоск"
];

const MANUAL_ALIASES = {
  "Наадам центр- Наадам дотор зогсоол": [
    "naadam",
    "naadam center",
    "naadam dotor zogsool",
    "naadam center dotor zogsool"
  ],
  "Наадам центр- Наадам номин урд зогсоол": [
    "naadam nomin",
    "naadam nomin urd zogsool",
    "naadam center nomin urd zogsool"
  ],
  "Наадам центр- Наадам Номин хажуу зогсоол": [
    "naadam nomin hajuu zogsool",
    "naadam center nomin hajuu zogsool"
  ],
  "М-Си-Эс плаза": ["mcs plaza", "mcs plazza"],
  "Zaisan square": ["zaisan skver", "zaisan sq"],
  "Токио таун молл": ["tokyo town mall", "tokio taun moll"],
  "Нисэх номин": ["niseh nomin"],
  "Улаанбаатар их дэлгүүр": ["ub department store", "ulaanbaatar ih delguur"],
  "Галлериа Улаанбаатар": ["galleria ulaanbaatar", "galeria ulaanbaatar"],
  "Сонгдо эмнэлэг": ["songdo hospital"],
  "Монгол японы эмнэлэг": ["mongol japan hospital", "mongol yapon emneleg"]
};

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function transliterateCyrillic(value) {
  const map = {
    а: "a", ә: "e", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "j", з: "z",
    и: "i", й: "i", к: "k", л: "l", м: "m", н: "n", о: "o", ө: "u", п: "p", р: "r",
    с: "s", т: "t", у: "u", ү: "u", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "sh",
    ъ: "", ы: "i", ь: "", э: "e", ю: "yu", я: "ya"
  };

  return String(value || "")
    .split("")
    .map((char) => {
      const lower = char.toLowerCase();
      return Object.prototype.hasOwnProperty.call(map, lower) ? map[lower] : char;
    })
    .join("");
}

function normalizeAliasForBuild(value) {
  return String(value || "")
    .replace(/[\-_/,]+/g, " ")
    .replace(/'/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeParkingText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function buildAliases(name) {
  const compactName = String(name || "").trim();
  const normalizedName = normalizeAliasForBuild(compactName);
  const transliteratedName = normalizeAliasForBuild(transliterateCyrillic(compactName));
  const manualAliases = MANUAL_ALIASES[compactName] || [];

  return unique([
    compactName,
    normalizedName,
    transliteratedName,
    ...manualAliases,
    ...manualAliases.map(transliterateCyrillic),
    normalizedName.replace(/зогсоол/gi, "").trim(),
    transliteratedName.replace(/zogsool/gi, "").trim(),
    normalizedName.replace(/хотхон/gi, "").trim(),
    transliteratedName.replace(/khotkhon/gi, "").trim(),
    normalizedName.replace(/эмнэлэг/gi, "").trim(),
    transliteratedName.replace(/emneleg/gi, "").trim()
  ]);
}

const PARKING_PRESETS = PARKING_NAMES.map((name) => ({
  name,
  aliases: buildAliases(name)
}));

function getPresetAliases(preset) {
  return [preset.name, ...(preset.aliases || [])].map(normalizeParkingText);
}

function findExactParkingPreset(value) {
  const normalizedValue = normalizeParkingText(value);

  if (!normalizedValue) {
    return null;
  }

  for (const preset of PARKING_PRESETS) {
    const aliases = getPresetAliases(preset);

    if (aliases.includes(normalizedValue)) {
      return preset.name;
    }
  }

  return null;
}

function suggestParkingPresets(value, limit = 5) {
  const normalizedValue = normalizeParkingText(value);

  if (!normalizedValue || normalizedValue.length < 2) {
    return [];
  }

  return PARKING_PRESETS
    .map((preset) => {
      const aliases = getPresetAliases(preset);
      let score = 0;

      for (const alias of aliases) {
        if (alias === normalizedValue) {
          score = Math.max(score, 1000 + alias.length);
        } else if (alias.startsWith(normalizedValue)) {
          score = Math.max(score, 800 + alias.length);
        } else if (alias.includes(normalizedValue)) {
          score = Math.max(score, 600 + alias.length);
        } else if (normalizedValue.includes(alias)) {
          score = Math.max(score, 400 + alias.length);
        }
      }

      return { name: preset.name, score };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || left.name.localeCompare(right.name))
    .slice(0, limit)
    .map((item) => item.name);
}

function matchParkingPreset(value) {
  const exactMatch = findExactParkingPreset(value);

  if (exactMatch) {
    return exactMatch;
  }

  const normalizedValue = normalizeParkingText(value);

  if (!normalizedValue) {
    return null;
  }

  let bestPartialMatch = null;

  for (const preset of PARKING_PRESETS) {
    const aliases = getPresetAliases(preset);

    for (const alias of aliases) {
      if (normalizedValue.includes(alias) || alias.includes(normalizedValue)) {
        if (!bestPartialMatch || alias.length > bestPartialMatch.alias.length) {
          bestPartialMatch = { name: preset.name, alias };
        }
      }
    }
  }

  return bestPartialMatch?.name || null;
}

module.exports = {
  PARKING_PRESETS,
  findExactParkingPreset,
  suggestParkingPresets,
  matchParkingPreset
};