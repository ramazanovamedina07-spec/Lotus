const path = require("path");
const fs = require("fs");
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { initDb, run, get, all } = require("./db");
require("dotenv").config();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const JWT_SECRET = process.env.JWT_SECRET || "lotus_dev_secret_change_me";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const ADMIN_EMAIL = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();

app.use(express.json());
app.use(express.static(__dirname));

const CATALOG_PRODUCTS = [
  {
    id: 1,
    name: "Celimax Blackhead Jojoba Oil",
    category: "face",
    price: 7200,
    ingredients: "масло жожоба, растительные масла, витамин E",
    description: "Гидрофильное масло для мягкого растворения черных точек.",
    image_url: "images/products/celimax/celimax-blackhead-jojoba-oil-1.jpg",
    tags: "хит",
    stock: 120
  },
  {
    id: 2,
    name: "Celimax Dual Barrier Gel Cleanser",
    category: "face",
    price: 5900,
    ingredients: "церамиды, мягкие ПАВы, пантенол",
    description: "Деликатный гель для очищения и поддержки барьера.",
    image_url: "images/products/celimax/celimax-dual-barrier-gel-cleanser.jpg",
    tags: "новинка",
    stock: 140
  },
  {
    id: 3,
    name: "Celimax Dual Barrier Purifying Toner",
    category: "face",
    price: 6400,
    ingredients: "церамиды, центелла, ниацинамид",
    description: "Освежающий тонер для баланса и спокойной кожи.",
    image_url: "images/products/celimax/celimax-dual-barrier-purifying.jpg",
    tags: "",
    stock: 130
  },
  {
    id: 4,
    name: "Celimax Dual Barrier Cream",
    category: "face",
    price: 8800,
    ingredients: "церамиды, сквалан, пантенол",
    description: "Крем для укрепления защитного барьера.",
    image_url: "images/products/celimax/celimax-dual-barrier.jpg",
    tags: "хит",
    stock: 90
  },
  {
    id: 5,
    name: "Celimax Ji Woo Gae Baking Soda Foam",
    category: "face",
    price: 5200,
    ingredients: "пищевая сода, мягкие ПАВы",
    description: "Очищающая пенка для пор и контроля себума.",
    image_url: "images/products/celimax/celimax-ji-woo-gae-baking-soda-foam.jpg",
    tags: "",
    stock: 180
  },
  {
    id: 6,
    name: "Celimax Ji Woo Gae Cica BHA Toner",
    category: "face",
    price: 6800,
    ingredients: "центелла, BHA, чайное дерево",
    description: "Балансирующий тонер против воспалений.",
    image_url: "images/products/celimax/celimax-ji-woo-gae-cica-bha.jpg",
    tags: "",
    stock: 110
  },
  {
    id: 7,
    name: "Celimax Ji Woo Gae Cleansing Pad",
    category: "face",
    price: 6200,
    ingredients: "PHA, центелла, аллантоин",
    description: "Пэды для мягкого очищения и тонизирования.",
    image_url: "images/products/celimax/celimax-ji-woo-gae-cleansing-pad.jpg",
    tags: "",
    stock: 95
  },
  {
    id: 8,
    name: "Celimax Ji Woo Gae Toner",
    category: "face",
    price: 6300,
    ingredients: "центелла, чайное дерево",
    description: "Успокаивающий тонер для проблемной кожи.",
    image_url: "images/products/celimax/celimax-ji-woo-gae.jpg",
    tags: "",
    stock: 100
  },
  {
    id: 9,
    name: "Celimax Noni Energy Ampoule",
    category: "face",
    price: 9500,
    ingredients: "экстракт нони, ниацинамид, гиалуроновая кислота",
    description: "Ампульная сыворотка для сияния и упругости.",
    image_url: "images/products/celimax/celimax-noni-energy-ampoule.jpg",
    tags: "хит",
    stock: 80
  },
  {
    id: 10,
    name: "Celimax Noni Energy Mist",
    category: "face",
    price: 6900,
    ingredients: "экстракт нони, пантенол",
    description: "Увлажняющий мист для свежести в течение дня.",
    image_url: "images/products/celimax/celimax-noni-energy-mist.jpg",
    tags: "",
    stock: 150
  },
  {
    id: 11,
    name: "Celimax Noni Hydra Firming Cream",
    category: "face",
    price: 8900,
    ingredients: "экстракт нони, пептиды, гиалуроновая кислота",
    description: "Крем с лифтинг-эффектом и глубокой гидратацией.",
    image_url: "images/products/celimax/celimax-noni-hydra-firming.jpg",
    tags: "",
    stock: 90
  },
  {
    id: 12,
    name: "Celimax Oil Control Capsule Essence",
    category: "face",
    price: 7900,
    ingredients: "ниацинамид, цинк, микрокапсулы",
    description: "Эссенция для контроля себума и ровного тона.",
    image_url: "images/products/celimax/celimax-oil-control-capsule-essence.jpg",
    tags: "",
    stock: 100
  },
  {
    id: 13,
    name: "Celimax Oil Control Toner",
    category: "face",
    price: 6400,
    ingredients: "ниацинамид, цинк, чайное дерево",
    description: "Тонер для матовости и чистых пор.",
    image_url: "images/products/celimax/celimax-oil-control.jpg",
    tags: "",
    stock: 115
  },
  {
    id: 14,
    name: "Darling Balancing Act",
    category: "hair",
    price: 6900,
    ingredients: "пребиотики, мята, пантенол",
    description: "Балансирующий шампунь для кожи головы.",
    image_url: "images/products/darling/darling-balancing-act-1.jpg",
    tags: "новинка",
    stock: 130
  },
  {
    id: 15,
    name: "Darling Big Hair Energy",
    category: "hair",
    price: 7500,
    ingredients: "биотин, протеины, коллаген",
    description: "Шампунь для объема и плотности волос.",
    image_url: "images/products/darling/darling-big-hair-energy.jpg",
    tags: "",
    stock: 120
  },
  {
    id: 16,
    name: "Darling Body Dew",
    category: "body",
    price: 6200,
    ingredients: "глицерин, масла, витамин E",
    description: "Лосьон-сияние для гладкой кожи тела.",
    image_url: "images/products/darling/darling-body-dew.jpg",
    tags: "",
    stock: 140
  },
  {
    id: 17,
    name: "Darling Citopia",
    category: "body",
    price: 5900,
    ingredients: "витамин C, цитрусовые экстракты",
    description: "Бодрящий гель для душа с цитрусовым зарядом.",
    image_url: "images/products/darling/darling-citopia.jpg",
    tags: "",
    stock: 160
  },
  {
    id: 18,
    name: "Darling Damage Control",
    category: "hair",
    price: 7800,
    ingredients: "кератин, аргановое масло, протеины",
    description: "Восстанавливающий уход для поврежденных волос.",
    image_url: "images/products/darling/darling-damage-control.jpg",
    tags: "хит",
    stock: 110
  },
  {
    id: 19,
    name: "Darling Holy Water",
    category: "hair",
    price: 6900,
    ingredients: "гиалуроновая кислота, алоэ",
    description: "Увлажняющий спрей для мягкости и блеска.",
    image_url: "images/products/darling/darling-holy-water.jpg",
    tags: "",
    stock: 150
  },
  {
    id: 20,
    name: "Darling Pillow Talk",
    category: "hair",
    price: 7200,
    ingredients: "пантенол, ромашка",
    description: "Ночной уход для мягкости и гладкости волос.",
    image_url: "images/products/darling/darling-pillow-talk-1.jpg",
    tags: "",
    stock: 95
  },
  {
    id: 21,
    name: "Darling Red Vita Rescue",
    category: "hair",
    price: 7600,
    ingredients: "витамин C, антиоксиданты",
    description: "Сыворотка для укрепления и защиты волос.",
    image_url: "images/products/darling/darling-red-vita-rescue-1.jpg",
    tags: "",
    stock: 100
  },
  {
    id: 22,
    name: "Darling Rhubay",
    category: "hair",
    price: 7200,
    ingredients: "экстракт ревеня, AHA",
    description: "Освежающий пилинг для кожи головы.",
    image_url: "images/products/darling/darling-rhubay.jpg",
    tags: "",
    stock: 90
  },
  {
    id: 23,
    name: "Darling Sun Bouncer",
    category: "body",
    price: 8900,
    ingredients: "UV-фильтры, алоэ, витамин E",
    description: "Солнцезащитный крем для тела.",
    image_url: "images/products/darling/darling-sun-bouncer.jpg",
    tags: "новинка",
    stock: 120
  },
  {
    id: 24,
    name: "Darling Water Wall",
    category: "hair",
    price: 7100,
    ingredients: "гиалуроновая кислота, сквалан",
    description: "Увлажняющий кондиционер для гладкости волос.",
    image_url: "images/products/darling/darling-water-wall.jpg",
    tags: "",
    stock: 115
  },
  {
    id: 25,
    name: "Jimmy Choo Fever",
    category: "perfume",
    price: 59000,
    ingredients: "парфюмерная композиция, слива, ваниль",
    description: "Теплый и чувственный вечерний аромат.",
    image_url: "images/products/JIMMY%20CHOO/jimmy-choo-fever.jpg",
    tags: "хит",
    stock: 60
  },
  {
    id: 26,
    name: "Jimmy Choo I Want Choo With Love",
    category: "perfume",
    price: 62000,
    ingredients: "парфюмерная композиция, роза, мускус",
    description: "Романтичный цветочно-мускусный аромат.",
    image_url: "images/products/JIMMY%20CHOO/jimmy-choo-i-want-choo-with-love.jpg",
    tags: "",
    stock: 50
  },
  {
    id: 27,
    name: "Jimmy Choo I Want Choo",
    category: "perfume",
    price: 60000,
    ingredients: "парфюмерная композиция, персик, жасмин, ваниль",
    description: "Яркий, праздничный аромат с мягкой сладостью.",
    image_url: "images/products/JIMMY%20CHOO/jimmy-choo-i-want-choo.jpg",
    tags: "",
    stock: 55
  },
  {
    id: 28,
    name: "Jimmy Choo Man Blue",
    category: "men",
    price: 54000,
    ingredients: "парфюмерная композиция, бергамот, кожа",
    description: "Древесно-ароматический мужской парфюм.",
    image_url: "images/products/JIMMY%20CHOO/jimmy-choo-man-blue.jpg",
    tags: "",
    stock: 45
  },
  {
    id: 29,
    name: "Jimmy Choo Man Extreme",
    category: "men",
    price: 56000,
    ingredients: "парфюмерная композиция, черный перец, бобы тонка",
    description: "Интенсивный пряно-древесный аромат.",
    image_url: "images/products/JIMMY%20CHOO/jimmy-choo-man-extreme.jpg",
    tags: "",
    stock: 40
  },
  {
    id: 30,
    name: "Jimmy Choo Man Ice",
    category: "men",
    price: 52000,
    ingredients: "парфюмерная композиция, цитрус, мускус",
    description: "Свежий мужской аромат на каждый день.",
    image_url: "images/products/JIMMY%20CHOO/jimmy-choo-man-ice.jpg",
    tags: "",
    stock: 55
  },
  {
    id: 31,
    name: "Jimmy Choo Man Intense",
    category: "men",
    price: 57000,
    ingredients: "парфюмерная композиция, лаванда, пачули",
    description: "Глубокий древесно-амбровый аромат.",
    image_url: "images/products/JIMMY%20CHOO/jimmy-choo-man-intense.jpg",
    tags: "",
    stock: 42
  },
  {
    id: 32,
    name: "Jimmy Choo Perfumed Body Lotion",
    category: "body",
    price: 19000,
    ingredients: "масла, мускус, ваниль",
    description: "Парфюмированный лосьон для тела.",
    image_url: "images/products/JIMMY%20CHOO/jimmy-choo-perfumed-body-lotion.jpg",
    tags: "",
    stock: 70
  },
  {
    id: 33,
    name: "By Wishtrend Propolis Energy",
    category: "face",
    price: 7400,
    ingredients: "прополис, ниацинамид, пантенол",
    description: "Питательная сыворотка для сияния и комфорта кожи.",
    image_url: "images/products/darling/by-wishtrend-propolis-energy.jpg",
    tags: "новинка",
    stock: 85
  },
  {
    id: 34,
    name: "d'Alba White Truffle First Spray Serum",
    category: "face",
    price: 8900,
    ingredients: "белый трюфель, ниацинамид, масла",
    description: "Спрей-сыворотка для увлажнения и естественного glow-эффекта.",
    image_url: "images/products/darling/dalba-white-truffle-first-spray-serum.jpg",
    tags: "хит",
    stock: 78
  },
  {
    id: 35,
    name: "La Roche-Posay Anthelios",
    category: "face",
    price: 9600,
    ingredients: "UV-фильтры, термальная вода, антиоксиданты",
    description: "Легкий солнцезащитный флюид для ежедневной защиты кожи.",
    image_url: "images/products/darling/la-roche-posay-anthelios.jpg",
    tags: "",
    stock: 92
  },
  {
    id: 36,
    name: "La Roche-Posay Physio Toner",
    category: "face",
    price: 6900,
    ingredients: "термальная вода, глицерин, мягкие увлажнители",
    description: "Мягкий тоник для свежести и комфорта чувствительной кожи.",
    image_url: "images/products/darling/la-roche-posay-physio-toner.jpg",
    tags: "",
    stock: 88
  },
  {
    id: 37,
    name: "L'Oreal Revitalift Vitamin C",
    category: "face",
    price: 7800,
    ingredients: "витамин C, салициловая кислота, глицерин",
    description: "Сыворотка для сияния, ровного тона и более гладкой кожи.",
    image_url: "images/products/darling/loreal-revitalift-vitamin-c-1.jpg",
    tags: "новинка",
    stock: 84
  },
  {
    id: 38,
    name: "Manyo Bifida Biome Complex Ampoule",
    category: "face",
    price: 9800,
    ingredients: "бифидофермент, пептиды, гиалуроновая кислота",
    description: "Ампула для укрепления барьера и восстановления упругости кожи.",
    image_url: "images/products/darling/manyo-bifida-biome-complex-ampoule.jpg",
    tags: "хит",
    stock: 76
  },
  {
    id: 39,
    name: "Mixit Lab Wow Moisture Toner",
    category: "face",
    price: 5600,
    ingredients: "пантенол, алоэ, гиалуроновая кислота",
    description: "Увлажняющий тонер для мягкости и быстрого комфорта кожи.",
    image_url: "images/products/darling/mixit-lab-wow-moisture-toner.jpg",
    tags: "",
    stock: 110
  },
  {
    id: 40,
    name: "Mixsoon Soondy Centella Essence",
    category: "face",
    price: 8300,
    ingredients: "центелла, пантенол, бетаин",
    description: "Успокаивающая эссенция для чувствительной и реактивной кожи.",
    image_url: "images/products/darling/mixsoon-soondy-centella-essence.jpg",
    tags: "",
    stock: 82
  },
  {
    id: 41,
    name: "Monolove Milky Mushroom Glow",
    category: "face",
    price: 6100,
    ingredients: "грибные экстракты, ниацинамид, молочные протеины",
    description: "Сияющий уход для ровного тона и мягкой, напитанной кожи.",
    image_url: "images/products/darling/monolove-milky-mushroom-glow.jpg",
    tags: "новинка",
    stock: 93
  },
  {
    id: 42,
    name: "Nunkoro Nutriboost 2-in-1 Essence",
    category: "face",
    price: 7200,
    ingredients: "аминокислоты, пептиды, гиалуроновая кислота",
    description: "Эссенция 2-в-1 для питания, увлажнения и гладкости кожи.",
    image_url: "images/products/darling/nunkoro-nutriboost-2in1-essence.jpg",
    tags: "",
    stock: 87
  },
  {
    id: 43,
    name: "Pusy Ice Morning Tonic",
    category: "face",
    price: 5200,
    ingredients: "ментол, огуречный экстракт, ниацинамид",
    description: "Освежающий тоник с прохладным эффектом для утреннего ухода.",
    image_url: "images/products/darling/pusy-ice-morning-tonic.jpg",
    tags: "",
    stock: 108
  },
  {
    id: 44,
    name: "Skin1004 Madagascar Centella Ampoule",
    category: "face",
    price: 8700,
    ingredients: "центелла, пантенол, бетаин",
    description: "Успокаивающая ампула для снятия раздражения и укрепления барьера.",
    image_url: "images/products/darling/skin1004-madagascar-centella-ampoule.jpg",
    tags: "хит",
    stock: 79
  },
  {
    id: 45,
    name: "Some By Mi 30 Days Miracle Toner",
    category: "face",
    price: 7600,
    ingredients: "AHA, BHA, PHA, чайное дерево",
    description: "Обновляющий тонер для более ровной текстуры и чистых пор.",
    image_url: "images/products/darling/some-by-mi-30-days-miracle-toner.jpg",
    tags: "новинка",
    stock: 86
  },
  {
    id: 46,
    name: "The Act Hydrating Face Toner",
    category: "face",
    price: 4900,
    ingredients: "глицерин, алоэ, пантенол",
    description: "Базовый увлажняющий тоник для ежедневного мягкого ухода.",
    image_url: "images/products/darling/the-act-hydrating-face-toner.jpg",
    tags: "",
    stock: 118
  },
  {
    id: 47,
    name: "Vichy Purete Thermale",
    category: "face",
    price: 7100,
    ingredients: "термальная вода, мягкие ПАВы, глицерин",
    description: "Очищающий уход для свежести, комфорта и мягкости кожи.",
    image_url: "images/products/darling/vichy-purete-thermale.jpg",
    tags: "",
    stock: 91
  },
  {
    id: 48,
    name: "Yadah Oh My Sunscreen",
    category: "face",
    price: 5900,
    ingredients: "UV-фильтры, алоэ, пантенол",
    description: "Комфортный солнцезащитный крем для лица на каждый день.",
    image_url: "images/products/darling/yadah-oh-my-sunscreen.jpg",
    tags: "новинка",
    stock: 96
  }
];

const EXTRA_PRODUCT_MEDIA = {
  14: [
    {
      type: "video",
      url: "images/products/darling/darling-balancing-act-video.mp4",
      poster: "images/products/darling/darling-balancing-act-1.jpg"
    }
  ],
  19: [
    {
      type: "video",
      url: "images/products/darling/darling-holy-water-video.mp4",
      poster: "images/products/darling/darling-holy-water.jpg"
    }
  ],
  20: [
    {
      type: "video",
      url: "images/products/darling/darling-pillow-talk-video.mp4",
      poster: "images/products/darling/darling-pillow-talk-1.jpg"
    }
  ],
  21: [
    {
      type: "video",
      url: "images/products/darling/darling-red-vita-rescue-video.mp4",
      poster: "images/products/darling/darling-red-vita-rescue-1.jpg"
    }
  ],
  22: [
    {
      type: "image",
      url: "images/products/darling/darling-rhubay-1.jpg"
    },
    {
      type: "video",
      url: "images/products/darling/darling-rhubay-video.mp4",
      poster: "images/products/darling/darling-rhubay.jpg"
    }
  ],
  23: [
    {
      type: "video",
      url: "images/products/darling/darling-sun-bouncer-video.mp4",
      poster: "images/products/darling/darling-sun-bouncer.jpg"
    }
  ]
};

const REVIEW_AUTHOR_POOL = [
  "Алина",
  "Мадина",
  "София",
  "Ева",
  "Диана",
  "Камила",
  "Виктория",
  "Асия",
  "Лейла",
  "Марина",
  "Олег",
  "Данияр",
  "Тимур",
  "Руслан",
  "Эмир"
];

const REVIEW_RATING_PATTERNS = [
  [5, 5, 4],
  [5, 4, 5],
  [4, 5, 4],
  [5, 5, 5],
  [5, 4, 4]
];

const REVIEW_COPY_BANK = {
  face: {
    usage: [
      "в утреннем уходе",
      "в рутине для чувствительной кожи",
      "когда хотелось больше увлажнения без тяжести",
      "в паре с SPF и легким макияжем"
    ],
    results: [
      "Кожа ощущалась спокойнее, а тон визуально выглядел ровнее.",
      "Текстура оказалась комфортной и быстро вписалась в ежедневный уход.",
      "Понравилось, что средство не перегружает кожу и дает аккуратный ухоженный финиш.",
      "Через несколько применений стало проще держать баланс без сухости и липкости."
    ],
    finish: [
      "Оставила у себя в постоянной косметичке.",
      "Из тех средств, к которым приятно возвращаться снова.",
      "Хороший вариант, когда хочется понятного и стабильного результата.",
      "Особенно понравилось, что средство приятно ощущается и утром, и вечером."
    ]
  },
  hair: {
    usage: [
      "после активных укладок",
      "когда длине не хватало мягкости",
      "для более аккуратного вида волос без утяжеления",
      "в базовом уходе между масками"
    ],
    results: [
      "Волосы стали ощущаться более гладкими и визуально собранными.",
      "Появилось больше мягкости, а длина выглядела аккуратнее даже на второй день.",
      "Средство не утяжелило волосы и дало красивый ухоженный вид.",
      "По ощущениям стало меньше сухости на концах и больше эластичности."
    ],
    finish: [
      "Для моей рутины это очень удачное попадание.",
      "Сейчас одно из самых приятных средств в уходе за длиной.",
      "Использовать легко, а результат заметен без сложных комбинаций.",
      "Если нужен аккуратный и мягкий эффект, вариант действительно хороший."
    ]
  },
  body: {
    usage: [
      "после душа каждый день",
      "когда хотелось более комфортного ощущения на коже",
      "после солнца и активного дня",
      "в качестве быстрого ежедневного ухода"
    ],
    results: [
      "Кожа стала ощущаться мягче и визуально выглядела более ухоженной.",
      "Текстура приятная, распределяется быстро и не оставляет неприятной липкости.",
      "После использования кожа дольше остается комфортной и гладкой.",
      "Понравилось ощущение напитанности без тяжести и жирного слоя."
    ],
    finish: [
      "Отдельный плюс за то, что пользоваться им действительно приятно каждый день.",
      "С удовольствием повторила бы этот продукт еще раз.",
      "Хороший выбор для спокойного и красивого ежедневного ухода.",
      "Тот случай, когда эффект и комфорт совпали."
    ]
  },
  perfume: {
    usage: [
      "для дневных выходов",
      "на встречи и вечерние планы",
      "как аромат на каждый день",
      "когда хотелось чего-то заметного, но не слишком тяжелого"
    ],
    results: [
      "Звучание раскрывается мягко, но остается заметным и собранным.",
      "На коже аромат сидит красиво и не уходит в резкость.",
      "Понравился баланс между характером и носибельностью.",
      "Аромат дает настроение и ощущается дороже своей подачи."
    ],
    finish: [
      "Стойкость для меня оказалась очень достойной.",
      "Из тех ароматов, которые хочется надевать без особого повода.",
      "Хорошо собирает образ и не надоедает в течение дня.",
      "Теперь это один из заметных фаворитов в полке с ароматами."
    ]
  },
  men: {
    usage: [
      "как основной аромат на каждый день",
      "для офиса и встреч",
      "на прохладную погоду",
      "когда нужен более собранный и уверенный акцент"
    ],
    results: [
      "Звучание получилось чистым, уверенным и без лишней резкости.",
      "Аромат раскрывается аккуратно и держится заметно дольше, чем ожидалось.",
      "Есть приятная глубина, но носить его легко каждый день.",
      "Понравилось, что композиция ощущается взрослой и опрятной."
    ],
    finish: [
      "Для меня это удачный вариант без спорных нот.",
      "Хорошо работает и соло, и как часть более строгого образа.",
      "Повторил бы покупку без сомнений.",
      "Очень достойный вариант, если нужен универсальный мужской аромат."
    ]
  }
};

const INGREDIENT_GUIDE = {
  "ретинол": {
    purpose: "ускоряет обновление кожи, выравнивает текстуру и тон",
    concentration: "0.1-0.3% для старта, 0.5% после адаптации",
    frequency: "начинайте 1-2 раза в неделю вечером",
    introPlan: "первые 2 недели 1-2 раза в неделю, затем через день при хорошей переносимости",
    results: "первые заметные изменения обычно через 4-8 недель",
    avoidWith: "в один вечер не сочетать с AHA/BHA кислотами и агрессивными скрабами",
    pairWith: "гиалуроновая кислота, керамиды, пептиды, мягкий крем",
    notes: "наносите на сухую кожу и используйте SPF утром"
  },
  "салициловая кислота": {
    concentration: "обычно 0.5-2% в leave-on формулах",
    frequency: "стартуйте с 2-3 раз в неделю",
    avoidWith: "не комбинировать в один вечер с несколькими сильными кислотами",
    notes: "если есть сухость, уменьшите частоту"
  },
  "гиалуроновая кислота": {
    concentration: "обычно 0.1-2%",
    frequency: "подходит для ежедневного применения",
    notes: "наносите на слегка влажную кожу и закрывайте кремом"
  },
  "ниацинамид": {
    concentration: "2-5% для базы, 10% при хорошей переносимости",
    frequency: "1 раз в день для старта",
    notes: "для чувствительной кожи лучше начать с 2-5%"
  },
  "кератин": {
    concentration: "точный % зависит от формулы производителя",
    frequency: "обычно 2-4 раза в неделю",
    notes: "наносите акцентно на длину и поврежденные участки"
  },
  "витамин c": {
    concentration: "5-10% для старта, 10-20% для опытного использования",
    frequency: "обычно 1 раз в день, чаще утром",
    notes: "при раздражении уменьшите частоту"
  },
  "пептиды": {
    concentration: "обычно 1-5% в составе комплекса",
    frequency: "1-2 раза в день",
    notes: "хорошо сочетаются с увлажняющим уходом"
  }
};

const MEDICAL_PATTERN =
  /(леч|вылеч|диагноз|диагност|терап|таблет|препарат|доз|болезн|симптом|экзема|псориаз|дерматит|врач|назнач|антибиот|беремен|гв|противопоказ|побоч)/i;

function containsMedicalIntent(text) {
  return MEDICAL_PATTERN.test(String(text || ""));
}

function buildProductMedia(product) {
  const primaryImage = String(
    product?.image_url || buildFallbackImageUrl(product?.name, product?.category, product?.id)
  ).trim();
  const media = [];

  if (primaryImage) {
    media.push({ type: "image", url: primaryImage });
  }

  const extras = EXTRA_PRODUCT_MEDIA[Number(product?.id)] || [];
  for (const item of extras) {
    const url = String(item?.url || "").trim();
    if (!url || media.some((entry) => entry.url === url)) continue;

    const type = String(item?.type || "").toLowerCase() === "video" ? "video" : "image";
    const nextItem = { type, url };
    const poster = String(item?.poster || primaryImage).trim();
    if (type === "video" && poster) {
      nextItem.poster = poster;
    }
    media.push(nextItem);
  }

  return media;
}

function pickSeedValue(list, seed) {
  return list[seed % list.length];
}

function buildSeedReviewsForProduct(product) {
  const categoryKey = String(product?.category || "face").toLowerCase();
  const bank = REVIEW_COPY_BANK[categoryKey] || REVIEW_COPY_BANK.face;
  const ratingPattern = REVIEW_RATING_PATTERNS[Number(product?.id || 0) % REVIEW_RATING_PATTERNS.length];

  return [0, 1, 2].map((index) => {
    const authorName = pickSeedValue(REVIEW_AUTHOR_POOL, Number(product.id || 0) * 5 + index * 3);
    const usage = pickSeedValue(bank.usage, Number(product.id || 0) + index);
    const result = pickSeedValue(bank.results, Number(product.id || 0) * 2 + index);
    const finish = pickSeedValue(bank.finish, Number(product.id || 0) * 3 + index);
    const createdAt = new Date(Date.UTC(2026, 0, 6 + Number(product.id || 0) + index * 4, 9, 20, 0)).toISOString();

    return {
      authorName,
      authorEmail: normalizeEmail(`seed.review.${product.id}.${index}@lotus.local`),
      rating: ratingPattern[index] || 5,
      reviewText: `${product.name} отлично показал себя ${usage}. ${result} ${finish}`,
      createdAt
    };
  });
}

function parseJsonArray(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
}

function normalizeStringList(input, { maxItems = 12, maxLength = 60 } = {}) {
  const list = Array.isArray(input)
    ? input
    : typeof input === "string"
      ? input.split(",")
      : [];
  const seen = new Set();
  const result = [];

  list.forEach((value) => {
    const text = String(value || "").trim();
    if (!text || text.length > maxLength) return;
    const key = text.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    result.push(text);
  });

  return result.slice(0, maxItems);
}

const GIFT_CARD_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function normalizeGiftCardCode(value) {
  return String(value || "").trim().toUpperCase();
}

function generateGiftCardCode() {
  const section = (length) => {
    let output = "";
    for (let i = 0; i < length; i += 1) {
      const index = Math.floor(Math.random() * GIFT_CARD_CODE_CHARS.length);
      output += GIFT_CARD_CODE_CHARS[index];
    }
    return output;
  };

  return `LOTUS-${section(4)}-${section(4)}-${section(4)}`;
}

async function createUniqueGiftCardCode() {
  for (let i = 0; i < 8; i += 1) {
    const code = generateGiftCardCode();
    const exists = await get("SELECT id FROM gift_cards WHERE code = ?", [code]);
    if (!exists) return code;
  }
  throw new Error("Gift card code generation failed");
}

function isGiftCardExpired(expiresAt) {
  if (!expiresAt) return false;
  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() < Date.now();
}


function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^\p{L}\p{N}\s%+-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value) {
  return normalizeText(value)
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length > 1);
}

const INGREDIENT_ALIASES = {
  "ретинол": ["ретинол", "витамин а", "ретиноид", "ретиноиды"],
  "салициловая кислота": ["салициловая кислота", "bha", "бха", "салицилка", "салициловая"],
  "гиалуроновая кислота": ["гиалуроновая кислота", "гиалуронка", "hyaluronic", "гиалурон"],
  "ниацинамид": ["ниацинамид", "витамин b3", "niacinamide", "ниацинамид 10"],
  "кератин": ["кератин"],
  "витамин c": ["витамин c", "витамин с", "аскорбиновая кислота"],
  "пептиды": ["пептиды", "пептид"],
  "оксид цинка": ["оксид цинка", "zinc oxide", "spf"],
  "масло арганы": ["аргана", "масло арганы", "argan"],
  "экстракт лотоса": ["лотос", "экстракт лотоса"],
  "масло ши": ["масло ши", "shea", "карите"],
  "алоэ вера": ["алоэ", "алоэ вера"]
};

const CATEGORY_ALIASES = {
  face: ["лицо", "кожа лица", "для лица", "face"],
  hair: ["волосы", "для волос", "hair", "голова", "кожа головы"],
  body: ["тело", "для тела", "body"],
  men: ["муж", "для мужчин", "men", "бритье", "бритья"]
};

const CONCERN_MAP = [
  { keywords: ["сухость", "сухая", "обезвож", "стянутость"], ingredients: ["гиалуроновая кислота", "пептиды"] },
  { keywords: ["жирность", "жирная", "блеск", "черные точки", "поры"], ingredients: ["салициловая кислота", "ниацинамид"] },
  { keywords: ["тусклая", "тусклость", "пигментация", "пятна"], ingredients: ["витамин c", "ретинол"] },
  { keywords: ["морщ", "возраст", "антивозраст"], ingredients: ["ретинол", "пептиды"] },
  { keywords: ["раздраж", "чувствитель"], ingredients: ["ниацинамид", "гиалуроновая кислота"] },
  { keywords: ["выпадение", "ломкость", "поврежденные"], ingredients: ["кератин"] }
];

const CATEGORY_LABELS = {
  face: "уход за лицом",
  hair: "уход за волосами",
  body: "уход за телом",
  perfume: "ароматы",
  men: "мужской уход"
};

const TEST_TYPE_LABELS = {
  skin: "Тест кожи",
  hair: "Тест волос",
  aroma: "Тест аромата",
  stress: "Тест стресса",
  gift: "Тест подарка",
  color: "Тест цветотипа"
};

const SKIN_TYPE_PRODUCT_SIGNALS = {
  "сухая": ["церамиды", "сквалан", "пантенол", "гиалуроновая кислота", "крем", "mist", "увлаж", "noni"],
  "жирная": ["bha", "салициловая кислота", "ниацинамид", "чайное дерево", "тонер", "пенка", "control"],
  "комбинированная": ["ниацинамид", "центелла", "тонер", "гель", "сыворот", "mist"],
  "чувствительная": ["центелла", "церамиды", "пантенол", "аллантоин", "сквалан", "мягкие павы", "barrier"]
};

const SKIN_TYPE_AVOID_SIGNALS = {
  "сухая": ["bha", "baking soda"],
  "чувствительная": ["bha", "baking soda", "кислот"]
};

const HAIR_TYPE_PRODUCT_SIGNALS = {
  "жирная кожа головы": ["balancing", "clarifying", "шампун", "очищ", "citopia"],
  "сухая кожа головы": ["holy water", "увлаж", "mist", "масло", "water wall"],
  "чувствительная кожа головы": ["balancing", "мягк", "holy water"],
  "тонкие волосы": ["volume", "big hair", "energy", "lift"],
  "поврежденные волосы": ["damage", "repair", "keratin", "rescue", "пит", "восстанов"]
};

const GOAL_PRODUCT_SIGNALS = {
  "увлажнение и восстановление барьера": ["церамиды", "сквалан", "пантенол", "гиалуроновая кислота", "увлаж", "barrier"],
  "контроль воспалений и высыпаний": ["bha", "салициловая кислота", "ниацинамид", "центелла", "чайное дерево"],
  "выравнивание тона и постакне": ["витамин c", "ниацинамид", "центелла", "retinol"],
  "антивозрастной уход": ["ретинол", "пептиды", "витамин c", "firming", "energy"],
  "уход за волосами и кожей головы": ["шампун", "маск", "кожа головы", "волос", "repair", "balancing", "holy water"]
};

const PROMO_PRODUCT_IDS = new Set([1, 2, 4, 9, 18, 25, 27]);

function buildFallbackImageUrl(_name, category, id = null) {
  if (Number.isFinite(Number(id))) {
    const fileName = `${Number(id)}.svg`;
    const absPath = path.join(__dirname, "images", "products", "items", fileName);
    if (fs.existsSync(absPath)) {
      return `images/products/items/${fileName}`;
    }
  }

  const byCategory = {
    face: "images/products/items/1.svg",
    hair: "images/products/items/2.svg",
    body: "images/products/items/3.svg",
    perfume: "images/products/items/4.svg",
    men: "images/products/items/5.svg"
  };
  const key = String(category || "").trim().toLowerCase();
  return byCategory[key] || "images/products/items/1.svg";
}

async function getCartItemsWithImages(userId) {
  const rows = await all(
    `
    SELECT
      c.product_id as id,
      c.product_name as name,
      c.price,
      c.quantity,
      p.category,
      p.image_url
    FROM cart_items c
    LEFT JOIN products p ON p.id = c.product_id
    WHERE c.user_id = ?
    ORDER BY c.id DESC
    `,
    [userId]
  );

  return rows.map((item) => ({
    id: Number(item.id),
    name: String(item.name || "").trim(),
    price: Math.round(Number(item.price) || 0),
    quantity: Math.max(1, Number(item.quantity) || 1),
    image_url:
      String(item.image_url || "").trim() ||
      buildFallbackImageUrl(item.name, item.category, item.id)
  }));
}

const INCI_BY_KEYWORD = {
  "салициловая кислота": "Salicylic Acid",
  "центелла": "Centella Asiatica Extract",
  "пептиды": "Palmitoyl Tripeptide-1, Palmitoyl Tetrapeptide-7",
  "ниацинамид": "Niacinamide",
  "витамин c": "Ascorbic Acid",
  "гиалуроновая кислота": "Sodium Hyaluronate",
  "оксид цинка": "Zinc Oxide",
  "кофеин": "Caffeine",
  "пробиотики": "Lactobacillus Ferment",
  "керамиды": "Ceramide NP, Ceramide AP, Ceramide EOP",
  "цинк": "Zinc PCA",
  "муцин улитки": "Snail Secretion Filtrate",
  "рисовый экстракт": "Oryza Sativa (Rice) Extract",
  "протеины": "Hydrolyzed Wheat Protein, Hydrolyzed Soy Protein",
  "липиды": "Phospholipids",
  "масло арганы": "Argania Spinosa Kernel Oil",
  "масло рукоу": "Bixa Orellana Seed Oil",
  "масло ши": "Butyrospermum Parkii (Shea) Butter",
  "гуарана": "Paullinia Cupana Seed Extract",
  "мочевина": "Urea",
  "алоэ вера": "Aloe Barbadensis Leaf Juice",
  "роза": "Rosa Damascena Flower Oil",
  "мускус": "Musk Accord",
  "кедр": "Cedrus Atlantica Bark Oil",
  "бергамот": "Citrus Aurantium Bergamia (Bergamot) Peel Oil",
  "цитрус": "Citrus Limon Peel Oil",
  "лаванда": "Lavandula Angustifolia Oil",
  "ваниль": "Vanilla Planifolia Fruit Extract",
  "жасмин": "Jasminum Officinale Flower Extract",
  "черная смородина": "Ribes Nigrum Fruit Extract",
  "пачули": "Pogostemon Cablin Oil",
  "глицерин": "Glycerin",
  "пантенол": "Panthenol"
};

function buildDetailedComposition(product) {
  const explicit = String(product?.composition || "").trim();
  if (explicit) return explicit;

  const base = [
    "Aqua",
    "Glycerin",
    "Propanediol",
    "Butylene Glycol",
    "Caprylic/Capric Triglyceride",
    "Cetearyl Alcohol",
    "Glyceryl Stearate",
    "PEG-100 Stearate",
    "Dimethicone",
    "Carbomer",
    "Tromethamine",
    "Disodium EDTA",
    "Phenoxyethanol",
    "Ethylhexylglycerin"
  ];

  const ingredientsText = String(product?.ingredients || "").toLowerCase();
  const actives = Object.entries(INCI_BY_KEYWORD)
    .filter(([keyword]) => ingredientsText.includes(keyword))
    .map(([, inci]) => inci);

  const unique = Array.from(new Set([...base, ...actives]));
  return unique.join(", ");
}

function buildCatalogContext() {
  return CATALOG_PRODUCTS.map((product) => {
    return `${product.name} | категория: ${product.category} | ингредиенты: ${product.ingredients}`;
  }).join("\n");
}

function formatCategoryLabel(category) {
  return CATEGORY_LABELS[String(category || "").trim().toLowerCase()] || "каталог Lotus";
}

function textIncludesAny(text, keywords = []) {
  const source = normalizeText(text);
  return keywords.some((keyword) => source.includes(normalizeText(keyword)));
}

function inferProductRole(product) {
  const haystack = normalizeText(`${product?.name || ""} ${product?.description || ""} ${product?.ingredients || ""}`);

  if (textIncludesAny(haystack, ["spf", "sunscreen", "sun", "uv", "anthelios", "оксид цинка"])) return "spf";
  if (textIncludesAny(haystack, ["cleanser", "cleansing", "пенка", "гель для умывания", "умывания", "oil", "очищ"])) return "cleanser";
  if (textIncludesAny(haystack, ["toner", "тонер", "mist", "мист", "pad", "пэды"])) return "toner";
  if (textIncludesAny(haystack, ["serum", "ampoule", "essence", "сыворот", "ампул", "эссенц"])) return "serum";
  if (textIncludesAny(haystack, ["cream", "крем", "lotion", "эмульс"])) return "cream";
  if (textIncludesAny(haystack, ["shampoo", "шампун"])) return "shampoo";
  if (textIncludesAny(haystack, ["mask", "маска"])) return "mask";
  if (textIncludesAny(haystack, ["spray", "спрей"])) return "spray";
  if (textIncludesAny(haystack, ["perfume", "парфюм", "аромат", "edp", "edt"])) return "fragrance";
  return "care";
}

function buildRequestInsights(query, history = []) {
  const rawQuery = String(query || "").trim();
  const q = normalizeText(rawQuery);
  const historyText = normalizeText(
    history
      .slice(-6)
      .map((item) => String(item?.content || ""))
      .join(" ")
  );
  const combined = `${historyText} ${q}`.trim();

  const skinTypeMap = [
    ["сухая", ["сух", "обезвож", "шелуш", "стянут"]],
    ["жирная", ["жирн", "себум", "блеск", "поры"]],
    ["комбинированная", ["комбинир"]],
    ["чувствительная", ["чувств", "реактив", "покрас", "раздраж", "жжение"]]
  ];

  const hairTypeMap = [
    ["жирная кожа головы", ["жирн", "быстро пачка"]],
    ["сухая кожа головы", ["сух", "стянут", "шелуш"]],
    ["чувствительная кожа головы", ["чувств", "зуд", "жжение"]],
    ["тонкие волосы", ["тонк", "объем", "объема"]],
    ["поврежденные волосы", ["ломк", "сечен", "поврежд", "сухие волосы"]]
  ];

  const goalMap = [
    ["увлажнение и восстановление барьера", ["увлаж", "обезвож", "сухост", "барьер", "стянутость"]],
    ["контроль воспалений и высыпаний", ["акне", "прыщ", "высып", "черные точки", "поры"]],
    ["выравнивание тона и постакне", ["пигмент", "пятн", "постакне", "тон", "тускл"]],
    ["антивозрастной уход", ["морщ", "возраст", "антиэйдж", "anti age", "упруг"]],
    ["уход за волосами и кожей головы", ["волос", "кожа головы", "перхот", "выпад", "укладк", "длина"]]
  ];

  const skinTypes = skinTypeMap
    .filter(([, keys]) => keys.some((key) => combined.includes(key)))
    .map(([label]) => label);
  const hairTypes = hairTypeMap
    .filter(([, keys]) => keys.some((key) => combined.includes(key)))
    .map(([label]) => label);
  const goals = goalMap
    .filter(([, keys]) => keys.some((key) => combined.includes(key)))
    .map(([label]) => label);

  const ingredients = extractIngredientMentions(combined);
  const category = findCategory(combined);
  const concernIngredients = findConcernIngredients(combined);
  const concernLabels = CONCERN_MAP
    .filter((item) => item.keywords.some((keyword) => combined.includes(normalizeText(keyword))))
    .map((item) => item.keywords[0]);

  return {
    rawQuery,
    normalizedQuery: q,
    combined,
    skinTypes,
    hairTypes,
    goals,
    category,
    ingredients,
    concernIngredients,
    concernLabels
  };
}

function buildProductMatchReason(product, profile, reasons = []) {
  if (reasons.length > 0) {
    return reasons[0];
  }

  const role = inferProductRole(product);
  const roleText = {
    cleanser: "подойдет как очищающий шаг",
    toner: "может быть мягким балансирующим шагом",
    serum: "закрывает активный этап ухода",
    cream: "работает как базовый крем",
    spf: "закрывает защиту от солнца",
    shampoo: "подойдет для регулярного ухода за волосами",
    mask: "усилит уход по длине",
    spray: "может дать дополнительную защиту и комфорт",
    fragrance: "подойдет как ароматический акцент",
    care: "подходит по составу и задаче"
  };
  return roleText[role] || "подходит по составу и задаче";
}

function scoreProductForRequest(product, profile) {
  const haystack = normalizeText(
    `${product?.name || ""} ${product?.ingredients || ""} ${product?.description || ""} ${product?.tags || ""}`
  );
  const queryTokens = tokenize(profile.rawQuery);
  const reasons = [];
  let score = 0;

  const tokenHits = queryTokens.filter((token) => haystack.includes(token));
  if (tokenHits.length > 0) {
    score += tokenHits.length * 1.4;
  }

  if (profile.rawQuery && normalizeText(profile.rawQuery).includes(normalizeText(product.name))) {
    score += 9;
    reasons.push("товар упомянут в запросе напрямую");
  }

  if (profile.category) {
    if (product.category === profile.category) {
      score += 6;
      reasons.push(`это ${formatCategoryLabel(product.category)}`);
    } else {
      score -= 1.5;
    }
  }

  const ingredientMatches = profile.ingredients.filter((ingredient) =>
    normalizeText(product.ingredients || "").includes(normalizeText(ingredient))
  );
  if (ingredientMatches.length > 0) {
    score += ingredientMatches.length * 5;
    reasons.push(`есть активы ${ingredientMatches.join(", ")}`);
  }

  const concernMatches = profile.concernIngredients.filter((ingredient) =>
    normalizeText(product.ingredients || "").includes(normalizeText(ingredient))
  );
  if (concernMatches.length > 0) {
    score += concernMatches.length * 4;
    reasons.push(`попадает в задачу через ${concernMatches.join(", ")}`);
  }

  for (const skinType of profile.skinTypes) {
    if (textIncludesAny(haystack, SKIN_TYPE_PRODUCT_SIGNALS[skinType] || [])) {
      score += 2.8;
      reasons.push(`лучше подходит для ${skinType} кожи`);
    }
    if (textIncludesAny(haystack, SKIN_TYPE_AVOID_SIGNALS[skinType] || [])) {
      score -= 1.6;
    }
  }

  for (const hairType of profile.hairTypes) {
    if (textIncludesAny(haystack, HAIR_TYPE_PRODUCT_SIGNALS[hairType] || [])) {
      score += 3;
      reasons.push(`релевантен для сценария: ${hairType}`);
    }
  }

  for (const goal of profile.goals) {
    if (textIncludesAny(haystack, GOAL_PRODUCT_SIGNALS[goal] || [])) {
      score += 2.4;
      reasons.push(`закрывает цель: ${goal}`);
    }
  }

  if (!profile.category && !profile.hairTypes.length && product.category === "face" && profile.skinTypes.length > 0) {
    score += 1.4;
  }

  if (!profile.category && product.category === "hair" && profile.hairTypes.length > 0) {
    score += 2;
  }

  if (PROMO_PRODUCT_IDS.has(Number(product.id))) {
    score += 0.35;
  }

  return {
    product,
    score,
    reasons: [...new Set(reasons)].slice(0, 3)
  };
}

function findRelevantProductsForRequest(queryOrProfile, history = [], limit = 6) {
  const profile = typeof queryOrProfile === "string"
    ? buildRequestInsights(queryOrProfile, history)
    : queryOrProfile;

  const scored = CATALOG_PRODUCTS
    .map((product) => scoreProductForRequest(product, profile))
    .sort((a, b) => b.score - a.score);

  const hasStrongProfile =
    Boolean(profile.category) ||
    profile.skinTypes.length > 0 ||
    profile.hairTypes.length > 0 ||
    profile.goals.length > 0 ||
    profile.ingredients.length > 0 ||
    profile.concernIngredients.length > 0;

  const minimumScore = hasStrongProfile ? 1.6 : 2.6;
  const filtered = scored.filter((item) => item.score >= minimumScore);
  return (filtered.length > 0 ? filtered : scored.filter((item) => item.score > 0)).slice(0, limit);
}

function buildRelevantCatalogContext(profile, relevantProducts) {
  if (!relevantProducts.length) {
    return "Точных совпадений по каталогу мало. Используй только те продукты Lotus, которые реально подходят по запросу.";
  }

  return relevantProducts
    .map((item, index) => {
      const { product, reasons } = item;
      return [
        `${index + 1}. ${product.name}`,
        `id: ${product.id}`,
        `категория: ${formatCategoryLabel(product.category)}`,
        `роль: ${inferProductRole(product)}`,
        `цена: ${Number(product.price || 0)} ₸`,
        `ингредиенты: ${product.ingredients || "не указаны"}`,
        `описание: ${product.description || "без описания"}`,
        `почему релевантен: ${reasons.join("; ") || "совпадает с запросом по составу/задаче"}`
      ].join(" | ");
    })
    .join("\n");
}

function buildRoutineOutlineFromMatches(matches, profile) {
  const products = matches.map((item) => item.product);
  if (products.length === 0) return "";

  const pick = (roles) => products.find((product) => roles.includes(inferProductRole(product)));

  if ((profile.category === "hair" || profile.hairTypes.length > 0) && products.some((item) => item.category === "hair")) {
    const shampoo = pick(["shampoo", "cleanser"]);
    const care = pick(["mask", "spray", "serum", "care"]);
    const lines = [];
    if (shampoo) lines.push(`• базовое мытье: ${shampoo.name}`);
    if (care) lines.push(`• дополнительный шаг по длине/коже головы: ${care.name}`);
    return lines.length ? lines.join("\n") : "";
  }

  const cleanser = pick(["cleanser"]);
  const toner = pick(["toner"]);
  const serum = pick(["serum"]);
  const cream = pick(["cream"]);
  const spf = pick(["spf"]);
  const morning = [cleanser, toner, serum, cream, spf].filter(Boolean).slice(0, 4);
  const evening = [cleanser, toner, serum, cream].filter(Boolean).slice(0, 4);

  if (morning.length === 0 && evening.length === 0) return "";

  return [
    `Утро: ${morning.map((product) => product.name).join(" -> ") || "мягкое очищение -> крем -> SPF"}`,
    `Вечер: ${evening.map((product) => product.name).join(" -> ") || "очищение -> актив -> крем"}`
  ].join("\n");
}

function isRecommendationIntent(query, profile) {
  const q = normalizeText(query);
  return (
    /подбери|посоветуй|что выбрать|что взять|какой крем|какая сыворотка|какой spf|нужен уход|собери|рутина|подойдет/i.test(q) ||
    profile.skinTypes.length > 0 ||
    profile.hairTypes.length > 0 ||
    profile.goals.length > 0 ||
    profile.concernIngredients.length > 0 ||
    profile.ingredients.length > 0
  );
}

function buildRecommendationReply(query, history = []) {
  const profile = buildRequestInsights(query, history);
  const relevantProducts = findRelevantProductsForRequest(profile, [], 4);
  if (!isRecommendationIntent(query, profile) || relevantProducts.length === 0) {
    return null;
  }

  const profileBits = [];
  if (profile.skinTypes.length) profileBits.push(`тип кожи: ${profile.skinTypes.join(", ")}`);
  if (profile.hairTypes.length) profileBits.push(`волосы/кожа головы: ${profile.hairTypes.join(", ")}`);
  if (profile.goals.length) profileBits.push(`цель: ${profile.goals.join(", ")}`);
  if (profile.concernLabels.length) profileBits.push(`что беспокоит: ${profile.concernLabels.join(", ")}`);

  const intro = profileBits.length
    ? `По вашему описанию вижу такой ориентир: ${profileBits.join("; ")}.`
    : "Под ваш запрос лучше всего смотрятся такие варианты из каталога Lotus.";

  const productsText = relevantProducts
    .map((item) => `• ${item.product.name} — ${buildProductMatchReason(item.product, profile, item.reasons)}.`)
    .join("\n");

  const routine = buildRoutineOutlineFromMatches(relevantProducts, profile);
  const closer = profileBits.length
    ? "Если хотите, следующим сообщением я могу сузить это до минимального набора из 2-3 средств или разложить по шагам на утро и вечер."
    : "Если напишете тип кожи, чувствительность и что именно беспокоит, я сделаю подбор еще точнее.";

  return [
    intro,
    "",
    "Что можно взять сейчас:",
    productsText,
    routine ? `\nКак встроить в уход:\n${routine}` : "",
    "",
    closer
  ]
    .filter(Boolean)
    .join("\n");
}

function buildAIProductPayload(matches = []) {
  return matches.slice(0, 4).map((item) => ({
    id: item.product.id,
    name: item.product.name,
    price: Number(item.product.price || 0),
    description: String(item.product.description || "").trim(),
    ingredients: String(item.product.ingredients || "").trim(),
    image_url: item.product.image_url || buildFallbackImageUrl(item.product.name, item.product.category, item.product.id),
    category: item.product.category
  }));
}

function findIngredientGuide(query) {
  const q = normalizeText(query);
  for (const [canonicalName, aliases] of Object.entries(INGREDIENT_ALIASES)) {
    if (aliases.some((alias) => q.includes(normalizeText(alias)))) {
      const guide = INGREDIENT_GUIDE[canonicalName];
      if (guide) return { name: canonicalName, guide };
    }
  }
  const key = Object.keys(INGREDIENT_GUIDE).find((name) => q.includes(normalizeText(name)));
  return key ? { name: key, guide: INGREDIENT_GUIDE[key] } : null;
}

function getProductsForIngredient(ingredientName) {
  const key = normalizeText(ingredientName);
  const mappedConcentrations = {
    "Сыворотка с ретинолом": "точный % не указан производителем (ориентир старта: 0.1-0.3%)",
    "Ниацинамид 10%": "10%",
    "Тоник с салициловой кислотой": "точный % не указан (обычно 0.5-2%)",
    "Гель для умывания Pure Balance": "точный % не указан (в смываемых формулах обычно мягче)",
    "Пилинг для кожи головы": "точный % не указан"
  };

  return CATALOG_PRODUCTS
    .filter((product) => normalizeText(product.ingredients || "").includes(key))
    .map((product) => ({
      name: product.name,
      concentration: mappedConcentrations[product.name] || "точная концентрация не указана"
    }));
}

function findCategory(query) {
  const q = normalizeText(query);
  for (const [category, aliases] of Object.entries(CATEGORY_ALIASES)) {
    if (aliases.some((alias) => q.includes(normalizeText(alias)))) return category;
  }
  return null;
}

function findConcernIngredients(query) {
  const q = normalizeText(query);
  const match = CONCERN_MAP.find((item) => item.keywords.some((keyword) => q.includes(normalizeText(keyword))));
  return match ? match.ingredients : [];
}

function searchCatalogByTokens(query, limit = 5) {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  return CATALOG_PRODUCTS
    .map((product) => {
      const haystack = normalizeText(`${product.name} ${product.ingredients}`);
      const score = queryTokens.reduce((acc, token) => (haystack.includes(token) ? acc + 1 : acc), 0);
      return { product, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.product);
}

function extractIngredientMentions(query) {
  const q = normalizeText(query);
  const found = [];
  for (const [canonicalName, aliases] of Object.entries(INGREDIENT_ALIASES)) {
    if (aliases.some((alias) => q.includes(normalizeText(alias)))) {
      found.push(canonicalName);
    }
  }
  return [...new Set(found)];
}

function buildRoutineReply(query) {
  const category = findCategory(query) || "face";
  const concernIngredients = findConcernIngredients(query);
  const ingredientMentions = extractIngredientMentions(query);
  const priorityIngredients = ingredientMentions.length > 0 ? ingredientMentions : concernIngredients;

  let products = CATALOG_PRODUCTS.filter((product) => product.category === category);
  if (priorityIngredients.length > 0) {
    products = products.filter((product) =>
      priorityIngredients.some((ingredient) =>
        normalizeText(product.ingredients).includes(normalizeText(ingredient))
      )
    );
  }
  if (products.length === 0) {
    products = CATALOG_PRODUCTS.filter((product) => product.category === category);
  }

  const morning = [];
  const evening = [];
  for (const p of products) {
    const ing = normalizeText(p.ingredients);
    if (ing.includes("оксид цинка") || ing.includes("витамин c") || ing.includes("гиалуроновая кислота")) {
      morning.push(p);
    } else if (ing.includes("ретинол") || ing.includes("салициловая кислота")) {
      evening.push(p);
    } else {
      evening.push(p);
    }
  }

  const m = [...new Map(morning.map((p) => [p.id, p])).values()].slice(0, 3);
  const e = [...new Map(evening.map((p) => [p.id, p])).values()].slice(0, 4);

  const morningText = m.length ? m.map((p) => `• ${p.name} (${p.ingredients})`).join("\n") : "• мягкое очищение + SPF";
  const eveningText = e.length ? e.map((p) => `• ${p.name} (${p.ingredients})`).join("\n") : "• мягкое очищение + восстанавливающий крем";

  return [
    "Пример базовой рутины Lotus:",
    `Утро:\n${morningText}`,
    `Вечер:\n${eveningText}`,
    "Если хотите, уточните тип кожи (сухая/жирная/чувствительная), и я соберу более точный вариант."
  ].join("\n\n");
}

function inferPreferredAnswerFormat(query) {
  const q = normalizeText(query);

  if (extractIngredientMentions(q).length > 0) {
    return [
      "Формат ответа:",
      "1) коротко что это за актив и кому подходит",
      "2) как начать и как часто использовать",
      "3) с чем сочетать и чего избегать",
      "4) когда ждать результат",
      "5) какие продукты Lotus подходят под этот запрос"
    ].join("\n");
  }

  if (q.includes("рутин") || q.includes("утро") || q.includes("вечер") || q.includes("собери уход")) {
    return [
      "Формат ответа:",
      "1) кратко оцени задачу",
      "2) дай схему утро/вечер",
      "3) отдельно укажи, какие активы вводить постепенно",
      "4) добавь 2-4 продукта Lotus с объяснением зачем каждый нужен"
    ].join("\n");
  }

  if (q.includes("что выбрать") || q.includes("подбери") || q.includes("посоветуй") || q.includes("что взять")) {
    return [
      "Формат ответа:",
      "1) сначала назови логику подбора",
      "2) затем предложи до 4 продуктов Lotus",
      "3) для каждого продукта кратко объясни роль",
      "4) в конце дай один уточняющий вопрос, если данных мало"
    ].join("\n");
  }

  return [
    "Формат ответа:",
    "1) короткий вывод по сути запроса",
    "2) практические шаги",
    "3) если уместно, продукты Lotus",
    "4) один уточняющий вопрос только когда без него нельзя"
  ].join("\n");
}

function buildRequestProfile(query, history = []) {
  const profile = buildRequestInsights(query, history);

  const profileLines = [
    `Текущий запрос: ${profile.rawQuery || "не указан"}`,
    `Тип кожи: ${profile.skinTypes.join(", ") || "не указан"}`,
    `Тип волос/кожи головы: ${profile.hairTypes.join(", ") || "не указан"}`,
    `Цель: ${profile.goals.join(", ") || "не указана"}`,
    `Категория: ${profile.category || "не указана"}`,
    `Упомянутые активы: ${profile.ingredients.join(", ") || "нет"}`,
    `Релевантные активы по задаче: ${profile.concernIngredients.join(", ") || "нет"}`
  ];

  return profileLines.join("\n");
}

function clampReplyLength(text, max = 1800) {
  const content = String(text || "").trim();
  if (content.length <= max) return content;
  return `${content.slice(0, max - 1).trimEnd()}…`;
}

function buildIngredientDeepReply(ingredientName, guide) {
  const products = getProductsForIngredient(ingredientName);
  const productsText =
    products.length > 0
      ? products.map((p) => `• ${p.name} — ${p.concentration}`).join("\n")
      : "• В текущем каталоге Lotus нет точного совпадения по этому ингредиенту";

  return [
    `Актив: ${ingredientName}`,
    `Для чего: ${guide.purpose || "помогает в целевом уходе за кожей/волосами"}`,
    `Как внедрять: ${guide.introPlan || guide.frequency || "вводить постепенно с низкой частоты"}`,
    `Рабочие концентрации: ${guide.concentration || "зависит от формулы продукта"}`,
    `Когда ждать результат: ${guide.results || "обычно первые изменения заметны через 4-8 недель"}`,
    `С чем не сочетать: ${guide.avoidWith || "с сильными раздражающими активами в один этап ухода"}`,
    `С чем сочетать: ${guide.pairWith || "с увлажняющими и восстанавливающими компонентами"}`,
    "Продукты Lotus с этим активом:",
    productsText,
    `Важно: ${guide.notes || "ориентируйтесь на переносимость кожи и вводите актив постепенно"}`,
    "Это косметическая рекомендация общего характера, не медицинское назначение."
  ].join("\n\n");
}

function buildHairLoss8WeekPlan() {
  return [
    "Персональный план на 8 недель при выпадении волос:",
    "Недели 1-2:",
    "• мытье кожи головы по потребности мягким шампунем",
    "• 1 раз в неделю мягкий пилинг кожи головы",
    "• без тугих хвостов и горячих укладок",
    "",
    "Недели 3-4:",
    "• сохраняем базу и добавляем регулярный массаж кожи головы 3-5 минут в день",
    "• маска/бальзам только по длине, не на корни",
    "• фиксируем динамику (фото пробора 1 раз в 2 недели)",
    "",
    "Недели 5-6:",
    "• оцениваем уменьшение выпадения и ломкости",
    "• при жирности кожи головы оставляем пилинг 1 раз в 7-10 дней",
    "• при сухости уменьшаем частоту очищения и усиливаем увлажнение длины",
    "",
    "Недели 7-8:",
    "• закрепляем режим без резких изменений",
    "• при отсутствии улучшения записываемся к трихологу/дерматологу",
    "",
    "Минимальный контроль причин: сон, белок в рационе, стресс, лабораторные дефициты через врача."
  ].join("\n");
}

function buildContextFollowupReply(message, historyText) {
  const q = normalizeText(message);
  const context = normalizeText(historyText);
  const isContinue = /^(да|ага|ок|понятно|подробнее|дальше|что дальше|и что дальше|продолжай|еще|ещё)$/i.test(q);

  if (context.includes("выпад") || context.includes("волос")) {
    if (
      isContinue &&
      (context.includes("распишу персональный план по дням недели") ||
        context.includes("персональный план на 8 недель"))
    ) {
      return buildHairLoss8WeekPlan();
    }

    if (isContinue && context.includes("недели 1 2")) {
      return [
        "Следующий шаг после плана:",
        "• напишите ваш тип кожи головы (жирная/сухая/чувствительная)",
        "• есть ли зуд, перхоть или болезненность",
        "• как давно началось выпадение",
        "По этим данным я адаптирую план под вас точечно."
      ].join("\n");
    }

    return [
      "Продолжаю по выпадению волос.",
      "Что добавить к базовому плану:",
      "• проверьте дефициты и щитовидную железу через врача",
      "• избегайте тугих причесок и частого перегрева кожи головы",
      "• дайте уходу минимум 8-12 недель для оценки динамики",
      "Если хотите, распишу персональный план по дням недели."
    ].join("\n");
  }

  if (context.includes("ретинол")) {
    return [
      "Продолжаю по ретинолу.",
      "Старт-схема:",
      "• 1-2 раза в неделю вечером первые 2 недели",
      "• затем через день при хорошей переносимости",
      "• утром обязательно SPF",
      "Если есть сухость/жжение, уменьшите частоту и добавьте более плотное увлажнение."
    ].join("\n");
  }

  if (context.includes("чувств") || context.includes("сух")) {
    return [
      "Продолжаю по чувствительной/сухой коже.",
      "Минимальная рабочая схема:",
      "• утро: мягкое очищение -> увлажняющий крем -> SPF",
      "• вечер: мягкое очищение -> восстанавливающий крем",
      "• активы вводить по одному, не чаще 2-3 раз в неделю на старте"
    ].join("\n");
  }

  return "Понял, продолжаю. Уточните, пожалуйста, тип кожи/волос и цель, и я дам следующий конкретный шаг.";
}

function isLikelyFollowupQuery(query) {
  const q = normalizeText(query);
  if (!q) return false;
  if (/^(да|ага|ок|понятно|подробнее|дальше|что дальше|и что дальше|продолжай|еще|ещё)$/i.test(q)) return true;

  const words = q.split(" ").filter(Boolean);
  if (words.length <= 2) {
    return /^(и|еще|ещё|дальше|подробнее|что|как|почему|сколько)$/i.test(words[0] || "");
  }
  return false;
}

function buildGeneralSkincareReply(query) {
  const q = normalizeText(query);

  if (
    q.includes("увлаж") ||
    q.includes("обезвож") ||
    q.includes("сухост") ||
    q.includes("шелуш")
  ) {
    return [
      "Обычно кожу увлажняют 2 раза в день: утром и вечером.",
      "Базовая схема:",
      "• утром: мягкое очищение -> увлажняющий крем -> SPF",
      "• вечером: очищение -> увлажняющий или восстанавливающий крем",
      "Если кожа очень сухая/обезвоженная, можно добавить легкую увлажняющую сыворотку перед кремом.",
      "Ориентир: после ухода кожа должна быть комфортной, без стянутости и шелушения."
    ].join("\n");
  }

  if (q.includes("выпад") || q.includes("падают волосы") || q.includes("сильное выпадение") || q.includes("алопец")) {
    return [
      "Если волосы выпадают заметно сильнее обычного, важно смотреть на причины и триггеры, а не только на шампунь.",
      "",
      "Частые причины:",
      "• стресс, недосып, резкое похудение, перенесенная болезнь/температура (часто с задержкой 2-3 месяца)",
      "• дефициты (железо/ферритин, витамин D, B12, белок), несбалансированное питание",
      "• гормональные факторы и щитовидная железа",
      "• агрессивные укладки, частое натяжение волос, горячие инструменты без термозащиты",
      "• раздражение кожи головы, себорея, воспаление фолликулов",
      "",
      "Что делать по шагам:",
      "1) Уход за кожей головы: мягкий шампунь + 1 раз в 7-10 дней деликатное отшелушивание кожи головы.",
      "2) Уход за длиной: кондиционер/маска по длине, меньше травмирующих укладок, термозащита обязательно.",
      "3) Режим: сон 7-9 часов, достаточный белок и вода, снижение хронического стресса.",
      "4) Отслеживание: фото пробора/висков каждые 3-4 недели для объективной динамики.",
      "",
      "Когда обязательно к врачу-трихологу/дерматологу:",
      "• выпадение длится более 6-8 недель без улучшения",
      "• появились очаги поредения, зуд, жжение, боль, сильная перхоть",
      "• волосы редеют очень быстро",
      "",
      "Если хотите, я дам персональный план на 8 недель под ваш тип кожи головы (жирная/сухая/чувствительная) и длину волос."
    ].join("\n");
  }

  if (q.includes("spf") || q.includes("солнц") || q.includes("уф")) {
    return [
      "Базовые правила SPF:",
      "• используйте SPF 30-50 каждый день, даже в пасмурную погоду",
      "• наносите как последний шаг утреннего ухода",
      "• обновляйте каждые 2-3 часа при активном солнце",
      "• для чувствительной кожи чаще комфортны минеральные фильтры",
      "Если хотите, подберу формат SPF под ваш тип кожи (сухая/жирная/комбинированная)."
    ].join("\n");
  }

  if (q.includes("чувств") || q.includes("барьер") || q.includes("раздраж") || q.includes("покрас")) {
    return [
      "Как стабилизировать чувствительную кожу:",
      "• упростите уход на 2-3 недели (мягкое очищение + увлажнение + SPF)",
      "• добавьте церамиды, пантенол, сквалан, центеллу",
      "• активы вводите по одному, с интервалом 7-10 дней",
      "• избегайте частого сочетания кислот и ретиноидов в один вечер",
      "Если хотите, составлю мягкую рутину утро/вечер под вашу кожу."
    ].join("\n");
  }

  if (q.includes("акне") || q.includes("прыщ") || q.includes("высып")) {
    return [
      "Базовый план при склонности к высыпаниям:",
      "• мягкое очищение 1-2 раза в день без пересушивания",
      "• BHA (салициловая кислота) 2-4 раза в неделю",
      "• ниацинамид ежедневно для контроля себума и барьера",
      "• обязательный SPF утром",
      "Если высыпания болезненные/длительные, лучше очная консультация дерматолога."
    ].join("\n");
  }

  if (q.includes("пигмент") || q.includes("пятн") || q.includes("постакне") || q.includes("тон")) {
    return [
      "Как выравнивать тон и работать с пигментацией:",
      "• утром: витамин C + SPF",
      "• вечером: мягкий ретиноид или кислоты по переносимости",
      "• добавьте ниацинамид для более ровного тона",
      "• оценивайте результат минимум через 8-12 недель",
      "При желании соберу поэтапную схему без перегруза активами."
    ].join("\n");
  }

  if (q.includes("волос") || q.includes("кожа головы") || q.includes("перхот")) {
    return [
      "Базовый уход за волосами и кожей головы:",
      "• подбирайте шампунь по состоянию кожи головы, а не только длины",
      "• маски/бальзам наносите в основном по длине",
      "• при жирности кожи головы полезно периодическое мягкое отшелушивание",
      "• термозащита обязательна при горячей укладке",
      "Если опишете тип волос (тонкие/плотные, прямые/кудрявые), дам точную схему."
    ].join("\n");
  }

  if (q.includes("рутин") || q.includes("уход") || q.includes("утро") || q.includes("вечер")) {
    return [
      "Универсная база ухода:",
      "• утро: мягкое очищение -> увлажнение -> SPF",
      "• вечер: очищение -> актив по задаче -> восстанавливающий крем",
      "• активы вводите постепенно, начиная с 2-3 раз в неделю",
      "• не смешивайте сразу несколько сильных активов в один вечер",
      "Если хотите, настрою схему под ваш тип кожи и цель."
    ].join("\n");
  }

  return null;
}

function fallbackReply(message, history = []) {
  const q = normalizeText(message);
  const historyText = history
    .slice(-8)
    .map((item) => String(item?.content || ""))
    .join(" ");

  if (!q) {
    return "Напишите вопрос по коже, волосам, уходу или ингредиентам. Отвечу по делу и помогу собрать рабочую схему.";
  }

  if (q.length < 8 && !isLikelyFollowupQuery(q)) {
    return "Опишите запрос чуть точнее: что вас беспокоит, какой у вас тип кожи или волос и какую цель хотите решить. Тогда я дам конкретный, а не общий ответ.";
  }

  if (/^(да|ага|ок|понятно|подробнее|дальше|что дальше|и что дальше|продолжай|еще|ещё)$/i.test(q)) {
    return buildContextFollowupReply(q, historyText);
  }

  if (/^(привет|здравствуйте|добрый|hello|hi)\b/.test(q)) {
    return [
      "Привет! Я помогу с подбором косметики Lotus.",
      "Можно спросить, например:",
      "• «что взять для сухой кожи?»",
      "• «продукты с ниацинамидом»",
      "• «что есть для волос с кератином?»"
    ].join("\n");
  }

  if (q.includes("что умеешь") || q.includes("как работаешь")) {
    return [
      "Я умею:",
      "• отвечать на общие вопросы по уходу за кожей и волосами",
      "• объяснять активы: как использовать и с чем сочетать",
      "• собирать рутину утро/вечер под задачу",
      "• подбирать продукты Lotus под тип кожи, жалобы и цель",
      "• опираться на результаты ваших тестов, если вы вошли в аккаунт",
      "Опишите тип кожи/волос и цель, и я составлю план."
    ].join("\n");
  }

  const recommendationReply = buildRecommendationReply(message, history);
  if (recommendationReply) {
    return recommendationReply;
  }

  const generalReply = buildGeneralSkincareReply(q);
  if (generalReply) {
    return generalReply;
  }

  if (q.includes("подбери") || q.includes("что выбрать") || q.includes("что взять") || q.includes("посоветуй")) {
    const routineReply = buildRoutineReply(q);
    if (routineReply) {
      return [
        "Собрал стартовый вариант под ваш запрос.",
        routineReply,
        "Если напишете тип кожи/волос и чувствительность, я сделаю подбор точнее."
      ].join("\n\n");
    }
  }

  const ingredientGuide = findIngredientGuide(q);
  if (ingredientGuide) {
    return buildIngredientDeepReply(ingredientGuide.name, ingredientGuide.guide);
  }

  const mentionedIngredients = extractIngredientMentions(q);
  if (mentionedIngredients.length >= 2 && (q.includes("или") || q.includes("лучше") || q.includes("сравн"))) {
    const [a, b] = mentionedIngredients;
    const guideA = INGREDIENT_GUIDE[a] || {};
    const guideB = INGREDIENT_GUIDE[b] || {};
    return [
      `Сравнение: ${a} и ${b}`,
      `${a}: ${guideA.purpose || "подходит для целевого ухода"}, частота — ${guideA.frequency || "постепенно"}.`,
      `${b}: ${guideB.purpose || "подходит для целевого ухода"}, частота — ${guideB.frequency || "постепенно"}.`,
      "Если важна мягкость старта: обычно начинают с более щадящего актива и вводят второй позже.",
      "Напишите ваш тип кожи и цель, и я скажу, с чего лучше начать именно вам."
    ].join("\n\n");
  }

  const category = findCategory(q);
  if (category) {
    const byCategory = CATALOG_PRODUCTS.filter((product) => product.category === category).slice(0, 6);
    if (byCategory.length > 0) {
      const lines = byCategory.map((item) => `• ${item.name} (${item.ingredients})`);
      return [`Подборка Lotus по вашему запросу:`, lines.join("\n")].join("\n\n");
    }
  }

  const concernIngredients = findConcernIngredients(q);
  if (concernIngredients.length > 0) {
    const concernProducts = CATALOG_PRODUCTS.filter((product) =>
      concernIngredients.some((ingredient) => normalizeText(product.ingredients).includes(normalizeText(ingredient)))
    ).slice(0, 6);

    if (concernProducts.length > 0) {
      const lines = concernProducts.map((item) => `• ${item.name} (${item.ingredients})`);
      return [
        `Для вашего запроса подойдут активы: ${concernIngredients.join(", ")}.`,
        `Рекомендации из каталога Lotus:\n${lines.join("\n")}`,
        "Если хотите, уточните тип кожи и бюджет, и я сузю подбор."
      ].join("\n\n");
    }
  }

  const matches = searchCatalogByTokens(q, 6);
  if (matches.length === 0) {
    if (historyText.trim() && isLikelyFollowupQuery(q)) {
      return buildContextFollowupReply(q, historyText);
    }
    return "Опишите вашу цель чуть подробнее (тип кожи/волос, что беспокоит, как давно), и я дам конкретный план по шагам.";
  }

  const lines = matches.map((item) => `• ${item.name} (${item.ingredients})`);
  return [
    "Вот что выглядит наиболее релевантно в каталоге Lotus:",
    lines.join("\n"),
    "Если хотите, я могу сразу отсортировать это по типу кожи, чувствительности, бюджету или собрать готовую схему утро/вечер."
  ].join("\n\n");
}

async function askOpenAI(messages) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 18000);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: 0.35,
        max_tokens: 700,
        messages
      }),
      signal: controller.signal
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error?.message || "OpenAI request failed");
    }

    return String(data.choices?.[0]?.message?.content || "").trim();
  } finally {
    clearTimeout(timeout);
  }
}

async function buildUserBeautyMemory(userId) {
  if (!Number.isFinite(Number(userId)) || Number(userId) <= 0) {
    return "Сохраненных данных о тестах пользователя нет.";
  }

  try {
    const rows = await all(
      `
      SELECT test_type, result_title, answers_json, created_at
      FROM test_results
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 12
      `,
      [Number(userId)]
    );

    if (!rows.length) {
      return "Сохраненных данных о тестах пользователя нет.";
    }

    const latestByType = new Map();
    for (const row of rows) {
      if (!latestByType.has(row.test_type)) {
        latestByType.set(row.test_type, row);
      }
    }

    return Array.from(latestByType.values())
      .slice(0, 4)
      .map((row) => {
        const answers = normalizeStringList(parseJsonArray(row.answers_json), { maxItems: 5, maxLength: 90 });
        return [
          `${TEST_TYPE_LABELS[row.test_type] || row.test_type}: ${row.result_title || "без названия результата"}`,
          answers.length ? `ответы: ${answers.join("; ")}` : "",
          `дата: ${String(row.created_at || "").slice(0, 10)}`
        ]
          .filter(Boolean)
          .join(" | ");
      })
      .join("\n");
  } catch (_error) {
    return "Сохраненных данных о тестах пользователя нет.";
  }
}

function shouldAttachAIProducts(query, profile, relevantProducts) {
  if (!relevantProducts.length) return false;
  if (isRecommendationIntent(query, profile)) return true;
  return Boolean(profile.category);
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function parseOptionalAuthUser(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (_error) {
    return null;
  }
}

async function getProductReviewAccess(productId, authUser) {
  if (!Number.isFinite(Number(productId)) || Number(productId) <= 0) {
    return { canReview: false, reason: "invalid_product" };
  }

  if (!authUser?.id) {
    return { canReview: false, reason: "login_required" };
  }

  const user = await get("SELECT id, is_blocked FROM users WHERE id = ?", [authUser.id]);
  if (!user) {
    return { canReview: false, reason: "user_not_found" };
  }
  if (Number(user.is_blocked) === 1) {
    return { canReview: false, reason: "account_blocked" };
  }

  const purchased = await get(
    `
    SELECT oi.product_id
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.user_id = ? AND oi.product_id = ?
    LIMIT 1
    `,
    [user.id, Number(productId)]
  );

  if (!purchased) {
    return { canReview: false, reason: "purchase_required" };
  }

  const existingReview = await get(
    `
    SELECT id, status
    FROM reviews
    WHERE user_id = ? AND product_id = ?
    LIMIT 1
    `,
    [user.id, Number(productId)]
  );

  if (existingReview) {
    return {
      canReview: false,
      reason: "already_reviewed",
      status: String(existingReview.status || "")
    };
  }

  return { canReview: true, reason: "eligible" };
}

function adminMiddleware(req, res, next) {
  authMiddleware(req, res, async () => {
    try {
      const user = await get("SELECT id, role, is_blocked FROM users WHERE id = ?", [req.user.id]);
      if (!user) {
        res.status(401).json({ error: "User not found" });
        return;
      }
      if (Number(user.is_blocked) === 1) {
        res.status(403).json({ error: "Account is blocked" });
        return;
      }
      if (String(user.role || "").toLowerCase() !== "admin") {
        res.status(403).json({ error: "Admin access required" });
        return;
      }

      req.user = { ...req.user, role: user.role };
      next();
    } catch (_error) {
      res.status(500).json({ error: "Server error" });
    }
  });
}

function normalizeTags(raw) {
  if (Array.isArray(raw)) {
    return raw.map((tag) => String(tag || "").trim().toLowerCase()).filter(Boolean);
  }
  return String(raw || "")
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
}

async function hasUsedFreeConsultation({ userId, email }) {
  const clauses = [];
  const params = [];

  if (Number.isFinite(userId) && userId > 0) {
    clauses.push("user_id = ?");
    params.push(userId);
  }

  const normalizedEmail = normalizeEmail(email);
  if (normalizedEmail) {
    clauses.push("contact_email = ?");
    params.push(normalizedEmail);
  }

  if (clauses.length === 0) return false;

  const existing = await get(
    `
    SELECT id
    FROM consultations
    WHERE is_first_free = 1
      AND (${clauses.join(" OR ")})
    LIMIT 1
    `,
    params
  );

  return Boolean(existing);
}

async function ensureAdminBootstrap() {
  if (!ADMIN_EMAIL) return;
  try {
    await run("UPDATE users SET role = 'admin' WHERE email = ?", [ADMIN_EMAIL]);
  } catch (_error) {
    // Ignore bootstrap errors, app should still run.
  }
}

async function ensureProductsBootstrap() {
  try {
    await run("DELETE FROM products");
    await run("DELETE FROM sqlite_sequence WHERE name = 'products'");

    const now = new Date().toISOString();
    for (const product of CATALOG_PRODUCTS) {
      await run(
        `
        INSERT INTO products(id, name, category, price, description, ingredients, composition, image_url, tags, stock, is_active, created_at, updated_at)
        VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
        `,
        [
          Number(product.id),
          String(product.name || "").trim(),
          String(product.category || "face").trim().toLowerCase(),
          Math.round(Number(product.price || 0)),
          String(product.description || "").trim(),
          String(product.ingredients || "").trim(),
          String(product.composition || "").trim(),
          String(product.image_url || buildFallbackImageUrl(product.name, product.category, product.id)).trim(),
          String(product.tags || "").trim(),
          Math.max(0, Number(product.stock || 999)),
          now,
          now
        ]
      );
    }
  } catch (_error) {
    // Ignore bootstrap errors to avoid blocking app startup.
  }
}

async function ensureReviewsBootstrap() {
  try {
    for (const product of CATALOG_PRODUCTS) {
      const seedReviews = buildSeedReviewsForProduct(product);
      for (const review of seedReviews) {
        const existing = await get(
          `
          SELECT id
          FROM reviews
          WHERE product_id = ? AND author_email = ?
          LIMIT 1
          `,
          [Number(product.id), String(review.authorEmail || "")]
        );

        const params = [
          String(review.authorName || "").trim(),
          Math.max(1, Math.min(5, Number(review.rating || 5))),
          String(review.reviewText || "").trim().slice(0, 1500),
          String(review.createdAt || new Date().toISOString())
        ];

        if (existing) {
          await run(
            `
            UPDATE reviews
            SET author_name = ?, rating = ?, review_text = ?, created_at = ?, status = 'published'
            WHERE id = ?
            `,
            [...params, Number(existing.id)]
          );
          continue;
        }

        await run(
          `
          INSERT INTO reviews(product_id, user_id, author_name, author_email, rating, review_text, status, admin_reply, created_at)
          VALUES(?, NULL, ?, ?, ?, ?, 'published', '', ?)
          `,
          [
            Number(product.id),
            params[0],
            String(review.authorEmail || "").trim(),
            params[1],
            params[2],
            params[3]
          ]
        );
      }
    }
  } catch (_error) {
    // Ignore review bootstrap errors to avoid blocking app startup.
  }
}

async function ensurePromoTags() {
  try {
    const products = await all("SELECT id, tags FROM products");
    for (const product of products) {
      if (!PROMO_PRODUCT_IDS.has(Number(product.id))) continue;
      const currentTags = String(product.tags || "")
        .split(",")
        .map((x) => x.trim().toLowerCase())
        .filter(Boolean);
      if (currentTags.includes("акция")) continue;
      const nextTags = [...new Set([...currentTags, "акция"])].join(",");
      await run("UPDATE products SET tags = ?, updated_at = ? WHERE id = ?", [
        nextTags,
        new Date().toISOString(),
        product.id
      ]);
    }
  } catch (_error) {
    // Ignore tag bootstrap errors.
  }
}

const DELIVERY_STAGES = [
  { key: "processing", title: "Обработка", description: "Заказ принят и готовится к отправке." },
  { key: "shipped", title: "Отправлен", description: "Передан в службу доставки." },
  { key: "in_transit", title: "В пути", description: "Заказ направляется в ваш город." },
  { key: "out_for_delivery", title: "Курьер у вас", description: "Заказ передан курьеру." },
  { key: "delivered", title: "Доставлен", description: "Заказ успешно доставлен." }
];

const DELIVERY_STATUS_LABELS = {
  new: "Новый",
  processing: "Обработка",
  shipped: "Отправлен",
  in_transit: "В пути",
  out_for_delivery: "Курьер у вас",
  delivered: "Доставлен",
  cancelled: "Отменен"
};

function inferDeliveryStatus(rawStatus, createdAt) {
  const normalized = String(rawStatus || "").trim().toLowerCase();
  if (DELIVERY_STATUS_LABELS[normalized] && normalized !== "new") {
    return normalized;
  }

  const createdTs = Date.parse(String(createdAt || ""));
  if (!Number.isFinite(createdTs)) return "processing";
  const hours = Math.max(0, (Date.now() - createdTs) / 36e5);

  if (hours < 6) return "processing";
  if (hours < 24) return "shipped";
  if (hours < 48) return "in_transit";
  if (hours < 72) return "out_for_delivery";
  return "delivered";
}

function buildTrackingStages(currentStatus) {
  const currentIndex = DELIVERY_STAGES.findIndex((stage) => stage.key === currentStatus);
  return DELIVERY_STAGES.map((stage, index) => ({
    ...stage,
    isDone: currentIndex > -1 && index < currentIndex,
    isCurrent: currentIndex > -1 && index === currentIndex
  }));
}

function buildEtaText(createdAt, currentStatus) {
  if (currentStatus === "delivered") return "Заказ уже доставлен";
  if (currentStatus === "cancelled") return "Заказ отменен";

  const createdTs = Date.parse(String(createdAt || ""));
  if (!Number.isFinite(createdTs)) return "Ожидаемая доставка: 1-3 дня";

  const expectedTs = createdTs + 72 * 36e5;
  const eta = new Date(expectedTs);
  return `Ожидаемая доставка до ${eta.toLocaleDateString("ru-RU")}`;
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/ai/chat", async (req, res) => {
  const message = String(req.body?.message || "").trim();
  const history = Array.isArray(req.body?.history) ? req.body.history : [];

  if (!message) {
    res.status(400).json({ error: "Message is required" });
    return;
  }

  const authUser = parseOptionalAuthUser(req);
  const loggedIngredients = extractIngredientMentions(message).slice(0, 8).join(", ");
  run(
    "INSERT INTO ai_queries(user_id, query_text, top_ingredients, created_at) VALUES(?, ?, ?, ?)",
    [Number(authUser?.id) || null, message.slice(0, 2000), loggedIngredients, new Date().toISOString()]
  ).catch(() => {});

  if (containsMedicalIntent(message)) {
    res.json({
      reply:
        "Я не даю медицинских рекомендаций и не назначаю лечение. По вопросам симптомов, диагноза или терапии обратитесь к врачу. Но я могу помочь с безопасным разбором ухода, состава и подбором косметики Lotus под ваш тип кожи или волос."
    });
    return;
  }

  const requestProfileObject = buildRequestInsights(message, history);
  const requestProfile = buildRequestProfile(message, history);
  const preferredFormat = inferPreferredAnswerFormat(message);
  const relevantProducts = findRelevantProductsForRequest(requestProfileObject, [], 6);
  const relevantProductsPayload = shouldAttachAIProducts(message, requestProfileObject, relevantProducts)
    ? buildAIProductPayload(relevantProducts)
    : [];
  const userBeautyMemory = await buildUserBeautyMemory(authUser?.id);

 const systemPrompt = `
Ты Lotus AI-консультант по уходу за кожей и волосами.
Ты отвечаешь как сильный персональный skincare-эксперт: практично, структурно, спокойно и по делу.
Ты не ведешь себя как чат-бот: не отвечай шаблонно, не повторяй вводные, не задавай лишние вопросы, если информации уже достаточно.
Главная задача: дать полезный персонализированный ответ по сути запроса и, когда это уместно, связать его с реальными товарами Lotus.

Критерии хорошего ответа:
1) Сначала пойми задачу пользователя и отвечай именно на нее, а не общими фразами.
2) Не ставь диагнозы и не назначай лечение, препараты или дозировки.
3) При медицинском запросе коротко обозначь границу и предложи безопасный немедицинский план ухода.
4) Не пиши расплывчато. Пользователь должен получить конкретные шаги, частоту, логику и приоритеты.
5) Если данных хватает, не задавай лишних вопросов. Если данных не хватает критично, задай только 1 короткий уточняющий вопрос.
6) Если пользователь пишет о типе кожи, чувствительности, высыпаниях, сухости, волосах или другой задаче, сразу собери осмысленный ориентир и подбор, а не общую болтовню.
7) Если рекомендуешь продукты Lotus, объясняй зачем нужен каждый продукт и как встроить его в схему.
8) Если у пользователя есть результаты тестов, используй их как персональный контекст, если они релевантны вопросу.
9) При подборе сначала опирайся на список релевантных продуктов ниже. Используй точные названия товаров.
10) Когда данных уже хватает, дай готовый ответ в формате мини-плана, а не проси пользователя переписать вопрос.
11) Если запрос общий, все равно постарайся дать рабочий ориентир и только затем один уточняющий вопрос.
12) Не выдумывай продукты Lotus, ингредиенты, концентрации, эффекты и факты, которых нет в каталоге или контексте.
13) Не повторяй в каждом ответе длинные дисклеймеры. Предупреждение давай только когда оно реально нужно.
14) Пиши на русском языке. Тон: профессиональный, понятный, человеческий, без канцелярита.
15) Избегай ответов в стиле "все индивидуально" без пользы. Сначала дай рабочий ориентир, потом уточнение.

Как отвечать:
- если вопрос про рутину, дай схему утро/вечер и порядок шагов;
- если вопрос про актив, объясни для чего он, как начать, с чем сочетать и чего избегать;
- если вопрос про проблему кожи/волос, дай возможные причины, план ухода и триггеры;
- если вопрос про подбор, предложи несколько продуктов Lotus и объясни логику;
- если запрос сравнивает два актива или продукта, дай честное сравнение и сценарий выбора;
- если видишь тип кожи/волос и задачу, сам адаптируй ответ под это описание;
- если рекомендуешь товары, называй 2-5 самых релевантных, не делай длинный бесконтрольный список;
- если подбор не нужен, все равно можешь коротко предложить 1-3 товара в конце как опцию.

Текущий профиль запроса:
${requestProfile}

Память о пользователе по сохраненным тестам:
${userBeautyMemory}

${preferredFormat}

Релевантные продукты Lotus для этого запроса:
${buildRelevantCatalogContext(requestProfileObject, relevantProducts)}

Общий каталог Lotus:
${buildCatalogContext()}
  `.trim();

  const normalizedHistory = history
    .slice(-8)
    .filter((item) => item && (item.role === "user" || item.role === "assistant"))
    .map((item) => ({
      role: item.role,
      content: String(item.content || "").slice(0, 1000)
    }));

  const messages = [{ role: "system", content: systemPrompt }, ...normalizedHistory, { role: "user", content: message }];

  try {
    let reply = "";
    if (OPENAI_API_KEY) {
      reply = await askOpenAI(messages);
    } else {
      reply = fallbackReply(message, normalizedHistory);
    }

    if (!reply) {
      reply = fallbackReply(message, normalizedHistory);
    }
    res.json({
      reply: clampReplyLength(reply),
      products: relevantProductsPayload
    });
  } catch (error) {
    console.error("AI chat error:", error.message);
    res.json({
      reply:
        "Сейчас AI-сервис недоступен. Я все равно могу помочь по каталогу Lotus: напишите тип кожи, что вас беспокоит и какой результат хотите получить.",
      products: relevantProductsPayload
    });
  }
});

app.post("/api/auth/register", async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || "");
  const gender = String(req.body.gender || "").trim();
  const phone = String(req.body.phone || "").trim();

  if (!name || !email || password.length < 6) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  try {
    const existing = await get("SELECT id FROM users WHERE email = ?", [email]);
    if (existing) {
      res.status(409).json({ error: "Email already exists" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const createdAt = new Date().toISOString();
    const role = ADMIN_EMAIL && email === ADMIN_EMAIL ? "admin" : "user";

    const created = await run(
      "INSERT INTO users(name, email, password_hash, gender, phone, role, created_at) VALUES(?, ?, ?, ?, ?, ?, ?)",
      [name, email, passwordHash, gender, phone, role, createdAt]
    );

    const user = { id: created.id, name, email, gender, phone, role };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ token, user });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || "");

  try {
    const userRow = await get(
      "SELECT id, name, email, password_hash, gender, phone, role, is_blocked FROM users WHERE email = ?",
      [email]
    );

    if (!userRow) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    if (Number(userRow.is_blocked) === 1) {
      res.status(403).json({ error: "Account is blocked" });
      return;
    }

    const isValid = await bcrypt.compare(password, userRow.password_hash);
    if (!isValid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const user = {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      gender: userRow.gender || "",
      phone: userRow.phone || "",
      role: userRow.role || "user"
    };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/auth/me", authMiddleware, async (req, res) => {
  try {
    const user = await get(
      "SELECT id, name, email, gender, phone, role, is_blocked FROM users WHERE id = ?",
      [req.user.id]
    );

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (Number(user.is_blocked) === 1) {
      res.status(403).json({ error: "Account is blocked" });
      return;
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        gender: user.gender || "",
        phone: user.phone || "",
        role: user.role || "user"
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/gift-cards/purchase", authMiddleware, async (req, res) => {
  const amount = Math.round(Number(req.body?.amount || 0));
  const recipientName = String(req.body?.recipientName || "").trim();
  const recipientEmail = normalizeEmail(req.body?.recipientEmail || "");
  const message = String(req.body?.message || "").trim();

  if (!Number.isFinite(amount) || amount < 5000 || amount > 200000) {
    res.status(400).json({ error: "Invalid gift card amount" });
    return;
  }

  if (!recipientEmail || !recipientEmail.includes("@")) {
    res.status(400).json({ error: "Recipient email required" });
    return;
  }

  try {
    const user = await get("SELECT is_blocked FROM users WHERE id = ?", [req.user.id]);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    if (Number(user.is_blocked) === 1) {
      res.status(403).json({ error: "Account is blocked" });
      return;
    }

    const code = await createUniqueGiftCardCode();
    const createdAt = new Date().toISOString();

    await run(
      `
      INSERT INTO gift_cards(
        code, initial_amount, balance, status, purchaser_user_id,
        recipient_name, recipient_email, message, created_at
      )
      VALUES(?, ?, ?, 'active', ?, ?, ?, ?, ?)
      `,
      [
        code,
        amount,
        amount,
        req.user.id,
        recipientName.slice(0, 80),
        recipientEmail,
        message.slice(0, 600),
        createdAt
      ]
    );

    res.status(201).json({ code, amount, balance: amount });
  } catch (_error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/gift-cards/balance", async (req, res) => {
  const code = normalizeGiftCardCode(req.query.code || "");
  if (!code) {
    res.status(400).json({ error: "Gift card code required" });
    return;
  }

  try {
    const card = await get(
      "SELECT id, code, balance, status, expires_at FROM gift_cards WHERE code = ?",
      [code]
    );
    if (!card) {
      res.status(404).json({ error: "Gift card not found" });
      return;
    }

    const expired = isGiftCardExpired(card.expires_at);
    const active = card.status === "active" && !expired;

    res.json({
      code: card.code,
      balance: Number(card.balance) || 0,
      status: card.status,
      expiresAt: card.expires_at || "",
      active
    });
  } catch (_error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/cart", authMiddleware, async (req, res) => {
  try {
    const items = await getCartItemsWithImages(req.user.id);
    res.json({ items });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/cart/items", authMiddleware, async (req, res) => {
  const productId = Number(req.body.id);
  const name = String(req.body.name || "").trim();
  const price = Number(req.body.price);
  const quantity = Number(req.body.quantity || 1);

  if (!productId || !name || !Number.isFinite(price) || price < 0 || quantity < 1) {
    res.status(400).json({ error: "Invalid item" });
    return;
  }

  try {
    await run(
      `
      INSERT INTO cart_items(user_id, product_id, product_name, price, quantity)
      VALUES(?, ?, ?, ?, ?)
      ON CONFLICT(user_id, product_id) DO UPDATE SET quantity = quantity + excluded.quantity
      `,
      [req.user.id, productId, name, Math.round(price), Math.round(quantity)]
    );
    const items = await getCartItemsWithImages(req.user.id);
    res.status(201).json({ items });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.patch("/api/cart/items/:productId", authMiddleware, async (req, res) => {
  const productId = Number(req.params.productId);
  const quantity = Number(req.body.quantity);

  if (!productId || !Number.isFinite(quantity)) {
    res.status(400).json({ error: "Invalid item" });
    return;
  }

  try {
    if (quantity <= 0) {
      await run("DELETE FROM cart_items WHERE user_id = ? AND product_id = ?", [
        req.user.id,
        productId
      ]);
    } else {
      await run(
        "UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?",
        [Math.round(quantity), req.user.id, productId]
      );
    }

    const items = await getCartItemsWithImages(req.user.id);
    res.json({ items });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/api/cart/items/:productId", authMiddleware, async (req, res) => {
  const productId = Number(req.params.productId);
  if (!productId) {
    res.status(400).json({ error: "Invalid item" });
    return;
  }

  try {
    await run("DELETE FROM cart_items WHERE user_id = ? AND product_id = ?", [
      req.user.id,
      productId
    ]);
    const items = await getCartItemsWithImages(req.user.id);
    res.json({ items });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/orders/checkout", authMiddleware, async (req, res) => {
  const body = req.body || {};
  const contactName = String(body.name || "").trim();
  const contactEmail = normalizeEmail(body.email);
  const contactPhone = String(body.phone || "").trim();
  const city = String(body.city || "").trim();
  const street = String(body.street || "").trim();
  const apartment = String(body.apartment || "").trim();
  const giftCardCode = normalizeGiftCardCode(body.giftCardCode || "");

  if (!contactName || !contactEmail || !contactPhone || !city || !street) {
    res.status(400).json({ error: "Missing checkout fields" });
    return;
  }

  try {
    const cartItems = await all(
      "SELECT product_id as id, product_name as name, price, quantity FROM cart_items WHERE user_id = ?",
      [req.user.id]
    );

    if (cartItems.length === 0) {
      res.status(400).json({ error: "Cart is empty" });
      return;
    }

    const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    let giftCardAmount = 0;
    let giftCardId = null;

    if (giftCardCode) {
      const card = await get(
        "SELECT id, balance, status, expires_at FROM gift_cards WHERE code = ?",
        [giftCardCode]
      );
      if (!card) {
        res.status(400).json({ error: "Gift card not found" });
        return;
      }
      if (card.status !== "active") {
        res.status(400).json({ error: "Gift card is not active" });
        return;
      }
      if (isGiftCardExpired(card.expires_at)) {
        res.status(400).json({ error: "Gift card has expired" });
        return;
      }
      if (Number(card.balance) <= 0) {
        res.status(400).json({ error: "Gift card balance is empty" });
        return;
      }
      giftCardAmount = Math.min(Number(card.balance) || 0, total);
      giftCardId = card.id;
    }

    const createdAt = new Date().toISOString();

    const order = await run(
      `
      INSERT INTO orders(
        user_id, total, status, created_at, contact_name, contact_email,
        contact_phone, city, street, apartment, gift_card_code, gift_card_amount
      )
      VALUES(?, ?, 'processing', ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        req.user.id,
        Math.max(total - giftCardAmount, 0),
        createdAt,
        contactName,
        contactEmail,
        contactPhone,
        city,
        street,
        apartment,
        giftCardCode,
        giftCardAmount
      ]
    );

    for (const item of cartItems) {
      await run(
        `
        INSERT INTO order_items(order_id, product_id, product_name, price, quantity)
        VALUES(?, ?, ?, ?, ?)
        `,
        [order.id, item.id, item.name, item.price, item.quantity]
      );
    }

    await run("DELETE FROM cart_items WHERE user_id = ?", [req.user.id]);

    if (giftCardAmount > 0 && giftCardId) {
      await run(
        "UPDATE gift_cards SET balance = balance - ?, last_used_at = ? WHERE id = ?",
        [giftCardAmount, createdAt, giftCardId]
      );
      await run(
        `
        INSERT INTO gift_card_redemptions(gift_card_id, order_id, user_id, amount, created_at)
        VALUES(?, ?, ?, ?, ?)
        `,
        [giftCardId, order.id, req.user.id, giftCardAmount, createdAt]
      );
    }

    res.status(201).json({
      orderId: order.id,
      total: Math.max(total - giftCardAmount, 0),
      giftCardApplied: giftCardAmount
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/orders", authMiddleware, async (req, res) => {
  try {
    const orders = await all(
      "SELECT id, total, status, created_at FROM orders WHERE user_id = ? ORDER BY id DESC",
      [req.user.id]
    );

    const detailed = [];
    for (const order of orders) {
      const items = await all(
        "SELECT product_id as id, product_name as name, price, quantity FROM order_items WHERE order_id = ?",
        [order.id]
      );
      detailed.push({
        id: order.id,
        total: order.total,
        status: order.status,
        date: order.created_at,
        items
      });
    }

    res.json({ orders: detailed });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/orders/track", async (req, res) => {
  const orderId = Number(req.body?.orderId);
  const email = normalizeEmail(req.body?.email);

  if (!orderId) {
    res.status(400).json({ error: "Укажите номер заказа" });
    return;
  }

  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    let tokenUserId = null;
    if (token) {
      try {
        const payload = jwt.verify(token, JWT_SECRET);
        tokenUserId = Number(payload?.id) || null;
      } catch (_error) {
        tokenUserId = null;
      }
    }

    const order = await get(
      `
      SELECT id, user_id, total, status, created_at, contact_email, city, street, apartment
      FROM orders
      WHERE id = ?
      `,
      [orderId]
    );

    if (!order) {
      res.status(404).json({ error: "Заказ не найден" });
      return;
    }

    const isOwnerByToken = tokenUserId && Number(order.user_id) === tokenUserId;
    const isOwnerByEmail = email && normalizeEmail(order.contact_email) === email;
    if (!isOwnerByToken && !isOwnerByEmail) {
      res.status(403).json({ error: "Доступ к заказу запрещен. Проверьте номер заказа и email." });
      return;
    }

    const itemsCountRow = await get(
      "SELECT COALESCE(SUM(quantity), 0) AS count FROM order_items WHERE order_id = ?",
      [order.id]
    );

    const statusKey = inferDeliveryStatus(order.status, order.created_at);
    const trackingNumber = `LT-${String(order.id).padStart(6, "0")}`;
    const address = [order.city, order.street, order.apartment].filter(Boolean).join(", ");

    res.json({
      order: {
        id: order.id,
        trackingNumber,
        statusKey,
        statusLabel: DELIVERY_STATUS_LABELS[statusKey] || "В обработке",
        createdAt: order.created_at,
        etaText: buildEtaText(order.created_at, statusKey),
        total: Number(order.total) || 0,
        itemsCount: Number(itemsCountRow?.count) || 0,
        address,
        stages: buildTrackingStages(statusKey)
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/returns", async (req, res) => {
  const orderId = Number(req.body?.orderId);
  const email = normalizeEmail(req.body?.email);
  const reason = String(req.body?.reason || "").trim();
  const details = String(req.body?.details || "").trim().slice(0, 1000);

  if (!orderId || !email || reason.length < 3) {
    res.status(400).json({ error: "Укажите номер заказа, email и причину возврата" });
    return;
  }

  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    let tokenUserId = null;
    if (token) {
      try {
        const payload = jwt.verify(token, JWT_SECRET);
        tokenUserId = Number(payload?.id) || null;
      } catch (_error) {
        tokenUserId = null;
      }
    }

    const order = await get(
      `
      SELECT id, user_id, contact_email, created_at
      FROM orders
      WHERE id = ?
      `,
      [orderId]
    );

    if (!order) {
      res.status(404).json({ error: "Заказ не найден" });
      return;
    }

    const isOwnerByToken = tokenUserId && Number(order.user_id) === tokenUserId;
    const isOwnerByEmail = normalizeEmail(order.contact_email) === email;
    if (!isOwnerByToken && !isOwnerByEmail) {
      res.status(403).json({ error: "Нельзя оформить возврат для этого заказа" });
      return;
    }

    const orderAgeDays = Math.floor((Date.now() - Date.parse(order.created_at)) / (24 * 36e5));
    if (Number.isFinite(orderAgeDays) && orderAgeDays > 14) {
      res.status(400).json({ error: "Срок возврата истек (более 14 дней с момента заказа)" });
      return;
    }

    const existing = await get(
      `
      SELECT id, status
      FROM return_requests
      WHERE order_id = ? AND status IN ('pending', 'approved')
      ORDER BY id DESC
      LIMIT 1
      `,
      [orderId]
    );

    if (existing) {
      res.status(409).json({ error: `Заявка на возврат уже создана (#${existing.id})` });
      return;
    }

    const createdAt = new Date().toISOString();
    const created = await run(
      `
      INSERT INTO return_requests(order_id, user_id, contact_email, reason, details, status, created_at)
      VALUES(?, ?, ?, ?, ?, 'pending', ?)
      `,
      [orderId, tokenUserId || null, email, reason, details, createdAt]
    );

    res.status(201).json({
      request: {
        id: created.id,
        orderId,
        status: "pending",
        createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/consultations/eligibility", async (req, res) => {
  try {
    const authUser = parseOptionalAuthUser(req);
    const userId = Number(authUser?.id) || null;
    const email = normalizeEmail(req.body?.email || authUser?.email || "");
    const used = await hasUsedFreeConsultation({ userId, email });
    res.json({ canUseFree: !used });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/consultations/book", async (req, res) => {
  const contactName = String(req.body?.name || "").trim();
  const contactEmail = normalizeEmail(req.body?.email);
  const slot = String(req.body?.slot || "").trim();
  const goal = String(req.body?.goal || "").trim().slice(0, 2000);
  const type = String(req.body?.type || "").trim().toLowerCase();
  const isFreeRequested = type === "free";
  const isRepeatRequested = type === "repeat";

  if (!contactName || !contactEmail || !slot || goal.length < 20 || (!isFreeRequested && !isRepeatRequested)) {
    res.status(400).json({ error: "Некорректные данные записи" });
    return;
  }

  try {
    const authUser = parseOptionalAuthUser(req);
    const userId = Number(authUser?.id) || null;

    if (isFreeRequested) {
      const used = await hasUsedFreeConsultation({ userId, email: contactEmail });
      if (used) {
        res.status(409).json({
          error: "Бесплатная консультация уже была использована. Доступна повторная: 1990 ₸."
        });
        return;
      }
    }

    const createdAt = new Date().toISOString();
    const price = isFreeRequested ? 0 : 1990;
    const created = await run(
      `
      INSERT INTO consultations(
        user_id,
        contact_name,
        contact_email,
        slot,
        goal,
        consultation_type,
        is_first_free,
        price,
        platform,
        status,
        created_at
      )
      VALUES(?, ?, ?, ?, ?, ?, ?, ?, 'zoom', 'booked', ?)
      `,
      [
        userId || null,
        contactName,
        contactEmail,
        slot,
        goal,
        isFreeRequested ? "first_free" : "repeat_paid",
        isFreeRequested ? 1 : 0,
        price,
        createdAt
      ]
    );

    const zoomLink = `https://zoom.us/j/${String(created.id).padStart(9, "0")}`;
    await run("UPDATE consultations SET zoom_link = ? WHERE id = ?", [zoomLink, created.id]);

    res.status(201).json({
      booking: {
        id: created.id,
        slot,
        price,
        isFirstFree: isFreeRequested,
        platform: "zoom",
        zoomLink,
        createdAt
      }
    });
  } catch (error) {
    if (String(error?.message || "").includes("SQLITE_CONSTRAINT")) {
      res.status(409).json({
        error: "Бесплатная консультация уже использована для этого профиля. Выберите повторную консультацию."
      });
      return;
    }
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/tests/results", async (req, res) => {
  const testType = String(req.body?.testType || "").trim().toLowerCase();
  const resultKey = String(req.body?.resultKey || "").trim().toLowerCase();
  const resultTitle = String(req.body?.resultTitle || "").trim();
  const answers = normalizeStringList(req.body?.answers, { maxItems: 30, maxLength: 140 });
  const allowed = ["color", "skin", "hair", "aroma", "stress", "gift"];
  if (!allowed.includes(testType) || !resultKey) {
    res.status(400).json({ error: "Invalid test payload" });
    return;
  }

  try {
    const authUser = parseOptionalAuthUser(req);
    const createdAt = new Date().toISOString();
    await run(
      "INSERT INTO test_results(user_id, test_type, result_key, result_title, answers_json, created_at) VALUES(?, ?, ?, ?, ?, ?)",
      [
        Number(authUser?.id) || null,
        testType,
        resultKey,
        resultTitle.slice(0, 120),
        answers.length ? JSON.stringify(answers) : "",
        createdAt
      ]
    );
    res.status(201).json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/tests/results", authMiddleware, async (req, res) => {
  try {
    const user = await get("SELECT is_blocked FROM users WHERE id = ?", [req.user.id]);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    if (Number(user.is_blocked) === 1) {
      res.status(403).json({ error: "Account is blocked" });
      return;
    }

    const rows = await all(
      `
      SELECT id, test_type, result_key, result_title, answers_json, created_at
      FROM test_results
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
      `,
      [req.user.id]
    );

    const results = rows.map((row) => ({
      id: row.id,
      testType: row.test_type,
      resultKey: row.result_key,
      resultTitle: row.result_title || "",
      answers: normalizeStringList(parseJsonArray(row.answers_json), { maxItems: 30, maxLength: 140 }),
      createdAt: row.created_at
    }));

    res.json({ results });
  } catch (_error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/products", async (_req, res) => {
  try {
    const dbProducts = await all(
      `
      SELECT id, name, category, price, description, ingredients, composition, image_url, tags, stock
      FROM products
      WHERE is_active = 1
      ORDER BY id DESC
      `
    );

    if (!dbProducts.length) {
      const fallbackProducts = CATALOG_PRODUCTS.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        price: item.price,
        description: item.description || "",
        ingredients: item.ingredients || "",
        composition: buildDetailedComposition(item),
        image_url: String(item.image_url || buildFallbackImageUrl(item.name, item.category, item.id)).trim(),
        tags: String(item.tags || ""),
        stock: Number(item.stock ?? 999),
        media: buildProductMedia(item)
      }));
      res.json({ products: fallbackProducts });
      return;
    }

    const products = dbProducts.map((product) => ({
      ...product,
      composition: buildDetailedComposition(product),
      image_url: String(product.image_url || "").trim() || buildFallbackImageUrl(product.name, product.category, product.id),
      media: buildProductMedia(product)
    }));
    res.json({ products });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/products/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!id) {
    res.status(400).json({ error: "Invalid product id" });
    return;
  }

  try {
    const dbProduct = await get(
      `
      SELECT id, name, category, price, description, ingredients, composition, image_url, tags, stock
      FROM products
      WHERE id = ? AND is_active = 1
      `,
      [id]
    );

    if (dbProduct) {
      res.json({
        product: {
          ...dbProduct,
          composition: buildDetailedComposition(dbProduct),
          image_url: String(dbProduct.image_url || "").trim() || buildFallbackImageUrl(dbProduct.name, dbProduct.category, dbProduct.id),
          media: buildProductMedia(dbProduct)
        }
      });
      return;
    }

    const fallback = CATALOG_PRODUCTS.find((item) => Number(item.id) === id);
    if (!fallback) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    res.json({
      product: {
        id: fallback.id,
        name: fallback.name,
        category: fallback.category,
        price: fallback.price,
        description: fallback.description || "",
        ingredients: fallback.ingredients || "",
        composition: buildDetailedComposition(fallback),
        image_url: String(fallback.image_url || buildFallbackImageUrl(fallback.name, fallback.category, fallback.id)).trim(),
        tags: String(fallback.tags || ""),
        stock: Number(fallback.stock ?? 999),
        media: buildProductMedia(fallback)
      }
    });
  } catch (_error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/products/:id/reviews", async (req, res) => {
  const id = Number(req.params.id);
  if (!id) {
    res.status(400).json({ error: "Invalid product id" });
    return;
  }
  try {
    const authUser = parseOptionalAuthUser(req);
    const reviews = await all(
      `
      SELECT id, product_id, user_id, author_name, author_email, rating, review_text, status, admin_reply, created_at
      FROM reviews
      WHERE product_id = ? AND status = 'published'
      ORDER BY id DESC
      `,
      [id]
    );
    const ratingRow = await get(
      "SELECT COUNT(*) AS count, ROUND(AVG(rating), 1) AS avg FROM reviews WHERE product_id = ? AND status = 'published'",
      [id]
    );
    const reviewAccess = await getProductReviewAccess(id, authUser);
    res.json({
      reviews,
      stats: {
        count: Number(ratingRow?.count || 0),
        average: Number(ratingRow?.avg || 0)
      },
      reviewAccess
    });
  } catch (_error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/products/:id/reviews", async (req, res) => {
  const productId = Number(req.params.id);
  const rating = Number(req.body?.rating);
  const reviewText = String(req.body?.reviewText || "").trim();
  const authUser = parseOptionalAuthUser(req);

  if (!productId || !Number.isFinite(rating) || rating < 1 || rating > 5 || reviewText.length < 5) {
    res.status(400).json({ error: "Invalid review payload" });
    return;
  }

  try {
    if (!authUser?.id) {
      res.status(401).json({ error: "Только авторизованные покупатели могут оставлять отзывы" });
      return;
    }

    const dbProduct = await get("SELECT id FROM products WHERE id = ? AND is_active = 1", [productId]);
    const fallback = CATALOG_PRODUCTS.find((item) => Number(item.id) === productId);
    if (!dbProduct && !fallback) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    const reviewAccess = await getProductReviewAccess(productId, authUser);
    if (!reviewAccess.canReview) {
      const errors = {
        login_required: "Войдите в аккаунт, чтобы оставить отзыв",
        purchase_required: "Отзыв можно оставить только после покупки этого товара",
        already_reviewed: "Вы уже оставили отзыв к этому товару",
        account_blocked: "Аккаунт заблокирован"
      };
      res.status(reviewAccess.reason === "login_required" ? 401 : 403).json({
        error: errors[reviewAccess.reason] || "Вы пока не можете оставить отзыв"
      });
      return;
    }

    const user = await get("SELECT id, name, email, is_blocked FROM users WHERE id = ?", [authUser.id]);
    if (!user || Number(user.is_blocked) === 1) {
      res.status(403).json({ error: "Account is blocked" });
      return;
    }

    const userId = Number(user.id);
    const authorName = String(user.name || "").trim();
    const authorEmail = String(user.email || "").trim().toLowerCase();

    if (!authorName || !authorEmail || !authorEmail.includes("@")) {
      res.status(400).json({ error: "Name and email are required" });
      return;
    }

    const createdAt = new Date().toISOString();
    await run(
      `
      INSERT INTO reviews(product_id, user_id, author_name, author_email, rating, review_text, status, admin_reply, created_at)
      VALUES(?, ?, ?, ?, ?, ?, 'published', '', ?)
      `,
      [productId, userId, authorName, authorEmail, Math.round(rating), reviewText.slice(0, 1500), createdAt]
    );

    res.status(201).json({ ok: true });
  } catch (_error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/admin/products", adminMiddleware, async (_req, res) => {
  try {
    const products = await all(
      `
      SELECT id, name, category, price, description, ingredients, composition, image_url, tags, stock, is_active, created_at, updated_at
      FROM products
      ORDER BY id DESC
      `
    );
    res.json({ products });
  } catch (_error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/admin/products", adminMiddleware, async (req, res) => {
  const name = String(req.body?.name || "").trim();
  const category = String(req.body?.category || "").trim().toLowerCase();
  const price = Number(req.body?.price);
  const description = String(req.body?.description || "").trim();
  const ingredients = String(req.body?.ingredients || "").trim();
  const composition = String(req.body?.composition || "").trim();
  const imageUrl = String(req.body?.imageUrl || "").trim();
  const tags = normalizeTags(req.body?.tags).join(",");
  const stock = Math.max(0, Number(req.body?.stock || 0));

  if (!name || !category || !Number.isFinite(price) || price < 0) {
    res.status(400).json({ error: "Invalid product payload" });
    return;
  }

  try {
    const now = new Date().toISOString();
    const created = await run(
      `
      INSERT INTO products(name, category, price, description, ingredients, composition, image_url, tags, stock, is_active, created_at, updated_at)
      VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
      `,
      [name, category, Math.round(price), description, ingredients, composition, imageUrl, tags, Math.round(stock), now, now]
    );
    res.status(201).json({ id: created.id });
  } catch (_error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.patch("/api/admin/products/:id", adminMiddleware, async (req, res) => {
  const id = Number(req.params.id);
  if (!id) {
    res.status(400).json({ error: "Invalid product id" });
    return;
  }

  const patch = req.body || {};
  const name = String(patch.name || "").trim();
  const category = String(patch.category || "").trim().toLowerCase();
  const price = Number(patch.price);
  const description = String(patch.description || "").trim();
  const ingredients = String(patch.ingredients || "").trim();
  const composition = String(patch.composition || "").trim();
  const imageUrl = String(patch.imageUrl || "").trim();
  const tags = normalizeTags(patch.tags).join(",");
  const stock = Math.max(0, Number(patch.stock || 0));
  const isActive = patch.isActive === false || patch.isActive === 0 ? 0 : 1;

  if (!name || !category || !Number.isFinite(price) || price < 0) {
    res.status(400).json({ error: "Invalid product payload" });
    return;
  }

  try {
    const now = new Date().toISOString();
    await run(
      `
      UPDATE products
      SET name = ?, category = ?, price = ?, description = ?, ingredients = ?, composition = ?, image_url = ?, tags = ?, stock = ?, is_active = ?, updated_at = ?
      WHERE id = ?
      `,
      [name, category, Math.round(price), description, ingredients, composition, imageUrl, tags, Math.round(stock), isActive, now, id]
    );
    res.json({ ok: true });
  } catch (_error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/api/admin/products/:id", adminMiddleware, async (req, res) => {
  const id = Number(req.params.id);
  if (!id) {
    res.status(400).json({ error: "Invalid product id" });
    return;
  }
  try {
    await run("UPDATE products SET is_active = 0, updated_at = ? WHERE id = ?", [new Date().toISOString(), id]);
    res.json({ ok: true });
  } catch (_error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/admin/orders", adminMiddleware, async (_req, res) => {
  try {
    const orders = await all(
      `
      SELECT o.id, o.user_id, o.total, o.status, o.created_at, o.contact_name, o.contact_email, o.contact_phone, o.city, o.street, o.apartment,
             u.name as user_name, u.email as user_email
      FROM orders o
      LEFT JOIN users u ON u.id = o.user_id
      ORDER BY o.id DESC
      `
    );
    res.json({ orders });
  } catch (_error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.patch("/api/admin/orders/:id/status", adminMiddleware, async (req, res) => {
  const id = Number(req.params.id);
  const status = String(req.body?.status || "").trim().toLowerCase();
  const allowed = ["new", "processing", "shipped", "in_transit", "out_for_delivery", "delivered", "cancelled"];
  if (!id || !allowed.includes(status)) {
    res.status(400).json({ error: "Invalid status payload" });
    return;
  }
  try {
    await run("UPDATE orders SET status = ? WHERE id = ?", [status, id]);
    res.json({ ok: true });
  } catch (_error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/admin/users", adminMiddleware, async (_req, res) => {
  try {
    const users = await all(
      `
      SELECT u.id, u.name, u.email, u.phone, u.gender, u.role, u.is_blocked, u.created_at,
             COALESCE(SUM(o.total), 0) as spent_total,
             COUNT(o.id) as orders_count
      FROM users u
      LEFT JOIN orders o ON o.user_id = u.id
      GROUP BY u.id
      ORDER BY u.id DESC
      `
    );
    res.json({ users });
  } catch (_error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.patch("/api/admin/users/:id/block", adminMiddleware, async (req, res) => {
  const id = Number(req.params.id);
  const blocked = req.body?.blocked ? 1 : 0;
  if (!id) {
    res.status(400).json({ error: "Invalid user id" });
    return;
  }
  try {
    await run("UPDATE users SET is_blocked = ? WHERE id = ?", [blocked, id]);
    res.json({ ok: true });
  } catch (_error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/admin/tests/results", adminMiddleware, async (_req, res) => {
  try {
    const rows = await all(
      `
      SELECT tr.id, tr.test_type, tr.result_key, tr.result_title, tr.created_at,
             u.name as user_name, u.email as user_email
      FROM test_results tr
      LEFT JOIN users u ON u.id = tr.user_id
      ORDER BY tr.id DESC
      LIMIT 500
      `
    );
    res.json({ results: rows });
  } catch (_error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/admin/tests/stats", adminMiddleware, async (_req, res) => {
  try {
    const byType = await all(
      `
      SELECT test_type, COUNT(*) as count
      FROM test_results
      GROUP BY test_type
      ORDER BY count DESC
      `
    );
    const byResult = await all(
      `
      SELECT test_type, result_key, COUNT(*) as count
      FROM test_results
      GROUP BY test_type, result_key
      ORDER BY count DESC
      `
    );
    res.json({ byType, byResult });
  } catch (_error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/admin/analytics/overview", adminMiddleware, async (_req, res) => {
  try {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 36e5).toISOString();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 36e5).toISOString();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 36e5).toISOString();

    const [salesToday, salesWeek, salesMonth, usersTotal, usersMonth, topProducts, byCategory] = await Promise.all([
      get("SELECT COALESCE(SUM(total), 0) as sum FROM orders WHERE created_at >= ? AND status != 'cancelled'", [dayAgo]),
      get("SELECT COALESCE(SUM(total), 0) as sum FROM orders WHERE created_at >= ? AND status != 'cancelled'", [weekAgo]),
      get("SELECT COALESCE(SUM(total), 0) as sum FROM orders WHERE created_at >= ? AND status != 'cancelled'", [monthAgo]),
      get("SELECT COUNT(*) as count FROM users"),
      get("SELECT COUNT(*) as count FROM users WHERE created_at >= ?", [monthAgo]),
      all(
        `
        SELECT oi.product_name as name, SUM(oi.quantity) as qty
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE o.status != 'cancelled'
        GROUP BY oi.product_name
        ORDER BY qty DESC
        LIMIT 10
        `
      ),
      all(
        `
        SELECT p.category as category, SUM(oi.quantity) as qty
        FROM order_items oi
        JOIN products p ON p.id = oi.product_id
        GROUP BY p.category
        ORDER BY qty DESC
        `
      )
    ]);

    res.json({
      sales: {
        today: Number(salesToday?.sum) || 0,
        week: Number(salesWeek?.sum) || 0,
        month: Number(salesMonth?.sum) || 0
      },
      users: {
        total: Number(usersTotal?.count) || 0,
        month: Number(usersMonth?.count) || 0
      },
      topProducts,
      byCategory
    });
  } catch (_error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/admin", (_req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});

app.get("*", (req, res) => {
  const requested = path.join(__dirname, req.path);
  if (requested.endsWith(".html")) {
    res.sendFile(requested);
    return;
  }
  res.sendFile(path.join(__dirname, "index.html"));
});

function startServer(preferredPort, attempt = 0) {
  const maxAttempts = 10;
  const port = preferredPort + attempt;
  const server = app.listen(port, () => {
    if (attempt > 0) {
      console.warn(`Port ${preferredPort} is busy, switched to ${port}`);
    }
    console.log(`Lotus server started at http://localhost:${port}`);
  });

  server.on("error", (error) => {
    if (error?.code === "EADDRINUSE" && attempt < maxAttempts) {
      startServer(preferredPort, attempt + 1);
      return;
    }
    console.error("Failed to start server:", error);
    process.exit(1);
  });
}

initDb()
  .then(async () => {
    await ensureAdminBootstrap();
    await ensureProductsBootstrap();
    await ensureReviewsBootstrap();
    await ensurePromoTags();
    startServer(PORT);
  })
  .catch((error) => {
    console.error("Failed to init database:", error);
    process.exit(1);
  });










