window.RichmondCountries = [
  { code: "AE", name: "United Arab Emirates", dial: "+971" },
  { code: "SA", name: "Saudi Arabia", dial: "+966" },
  { code: "QA", name: "Qatar", dial: "+974" },
  { code: "KW", name: "Kuwait", dial: "+965" },
  { code: "BH", name: "Bahrain", dial: "+973" },
  { code: "OM", name: "Oman", dial: "+968" },
  { code: "IN", name: "India", dial: "+91" },
  { code: "PK", name: "Pakistan", dial: "+92" },
  { code: "GB", name: "United Kingdom", dial: "+44" },
  { code: "US", name: "United States", dial: "+1" },
  { code: "CA", name: "Canada", dial: "+1" },
  { code: "AU", name: "Australia", dial: "+61" },
  { code: "DE", name: "Germany", dial: "+49" },
  { code: "FR", name: "France", dial: "+33" },
  { code: "IT", name: "Italy", dial: "+39" },
  { code: "ES", name: "Spain", dial: "+34" },
  { code: "NL", name: "Netherlands", dial: "+31" },
  { code: "BE", name: "Belgium", dial: "+32" },
  { code: "CH", name: "Switzerland", dial: "+41" },
  { code: "SE", name: "Sweden", dial: "+46" },
  { code: "NO", name: "Norway", dial: "+47" },
  { code: "DK", name: "Denmark", dial: "+45" },
  { code: "IE", name: "Ireland", dial: "+353" },
  { code: "RU", name: "Russia", dial: "+7" },
  { code: "CN", name: "China", dial: "+86" },
  { code: "HK", name: "Hong Kong", dial: "+852" },
  { code: "SG", name: "Singapore", dial: "+65" },
  { code: "MY", name: "Malaysia", dial: "+60" },
  { code: "ID", name: "Indonesia", dial: "+62" },
  { code: "PH", name: "Philippines", dial: "+63" },
  { code: "TH", name: "Thailand", dial: "+66" },
  { code: "VN", name: "Vietnam", dial: "+84" },
  { code: "JP", name: "Japan", dial: "+81" },
  { code: "KR", name: "South Korea", dial: "+82" },
  { code: "TR", name: "Turkey", dial: "+90" },
  { code: "EG", name: "Egypt", dial: "+20" },
  { code: "JO", name: "Jordan", dial: "+962" },
  { code: "LB", name: "Lebanon", dial: "+961" },
  { code: "IQ", name: "Iraq", dial: "+964" },
  { code: "IR", name: "Iran", dial: "+98" },
  { code: "IL", name: "Israel", dial: "+972" },
  { code: "ZA", name: "South Africa", dial: "+27" },
  { code: "NG", name: "Nigeria", dial: "+234" },
  { code: "KE", name: "Kenya", dial: "+254" },
  { code: "GH", name: "Ghana", dial: "+233" },
  { code: "BR", name: "Brazil", dial: "+55" },
  { code: "MX", name: "Mexico", dial: "+52" },
  { code: "AR", name: "Argentina", dial: "+54" },
  { code: "NZ", name: "New Zealand", dial: "+64" },
  { code: "PL", name: "Poland", dial: "+48" },
  { code: "AT", name: "Austria", dial: "+43" },
  { code: "PT", name: "Portugal", dial: "+351" },
  { code: "GR", name: "Greece", dial: "+30" },
  { code: "RO", name: "Romania", dial: "+40" },
  { code: "UA", name: "Ukraine", dial: "+380" },
  { code: "BD", name: "Bangladesh", dial: "+880" },
  { code: "LK", name: "Sri Lanka", dial: "+94" },
  { code: "NP", name: "Nepal", dial: "+977" },
  { code: "KZ", name: "Kazakhstan", dial: "+7" },
  { code: "UZ", name: "Uzbekistan", dial: "+998" },
];

window.RichmondCountryUtils = {
  flag(code) {
    return code
      .toUpperCase()
      .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
  },

  byIso(code) {
    if (!code) return null;
    return window.RichmondCountries.find((c) => c.code === code.toUpperCase()) || null;
  },

  byDial(dial) {
    return window.RichmondCountries.find((c) => c.dial === dial) || null;
  },

  defaultIso() {
    const cookie = document.cookie.match(/(?:^|;\s*)tu_phone_country=([A-Z]{2})/i);
    if (cookie?.[1]) return cookie[1].toUpperCase();

    const lang = navigator.language || "";
    const parts = lang.split("-");
    if (parts.length > 1 && parts[1].length === 2) return parts[1].toUpperCase();

    return "AE";
  },
};
