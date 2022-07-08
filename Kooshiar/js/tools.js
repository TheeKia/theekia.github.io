function select(selector) {
  return document.querySelector(selector);
}
function selectAll(selector) {
  return document.querySelectorAll(selector);
}
function setDarkTheme(tf) {
  document.body.classList.toggle("DARKTHEME", tf);
}
function showItem(element) {
  element.style.opacity = 1;
}
function showFooterLoading(tf) {
  const element = select("#footer-loading--container");
  if (tf) {
    document.body.classList.add("LOADING");
    element.style.transform = "translateY(0)";
    element.style.opacity = 1;
  } else {
    document.body.classList.remove("LOADING");
    element.style.transform = "translateY(100%)";
    element.style.opacity = 0;
  }
}

const currentDate = new Date();

function sInsurance(number, text) {
  return number > 1 ? text + "s" : text;
}
function a_anInsurance(number, vowel = false) {
  return number > 1 ? number : vowel ? "an" : "a";
}
function dateToString(dateTime) {
  let text;
  let [date, time] = dateTime.split(" ");

  date = date.split("-");
  time = time.split(":");
  const pDate = new Date(
    date[0],
    date[1] - 1,
    date[2],
    time[0],
    time[1],
    time[2]
  );
  const diff = currentDate - pDate;
  let remainingSeconds = diff;

  let year = Math.floor(remainingSeconds / (1000 * 3600 * 24 * 365));
  remainingSeconds = diff % (1000 * 3600 * 24 * 365);

  let month = Math.floor(remainingSeconds / (1000 * 3600 * 24 * 30));
  remainingSeconds = remainingSeconds % (1000 * 3600 * 24 * 30);

  let day = Math.floor(remainingSeconds / (1000 * 3600 * 24));
  remainingSeconds = remainingSeconds % (1000 * 3600 * 24);

  let hour = Math.floor(remainingSeconds / (1000 * 3600));
  remainingSeconds = remainingSeconds % (1000 * 3600);

  let minute = Math.floor(remainingSeconds / (1000 * 60));
  remainingSeconds = remainingSeconds % (1000 * 60);

  if (day !== 0) text = ` ${a_anInsurance(day)} ${sInsurance(day, "day")}`;
  if (month !== 0)
    text = ` ${a_anInsurance(month)} ${sInsurance(month, "month")}`;
  if (year !== 0) {
    prevText = month > 0 ? " and" + text : "";
    text = `${a_anInsurance(year)} ${sInsurance(year, "year")}` + prevText;
  }

  if (year === 0 && month === 0 && day === 0) {
    if (hour === 0) {
      if (minute === 0) {
        text = "less than a minute";
      } else {
        text = `${a_anInsurance(minute)} ${sInsurance(minute, "minute")}`;
      }
    } else {
      text = `${a_anInsurance(hour, true)} ${sInsurance(hour, "hour")}`;
    }
  }

  text += " ago";

  return text;
}
