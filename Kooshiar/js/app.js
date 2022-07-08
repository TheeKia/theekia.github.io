// TODO: disable search while viewing saved products
const searchDelay = 400;
let windowWidth = window.innerWidth;
let minColWidth;

function setMinColWidth() {
  if (windowWidth <= 430) {
    minColWidth = 120;
  } else if (windowWidth <= 750) {
    minColWidth = 130;
  } else if (windowWidth <= 1000) {
    minColWidth = 140;
  } else {
    minColWidth = 200;
  }
}

setMinColWidth();

/**
 * * Variables
 */

//    Loading
let isLoading = true;
let addedItems = 0;
let searchResultsCount = 0;
let isSearching = false;
let isShowingFavorites = false;
//    Timouts
let loadingTimeout, refreshTimeout, similarsTimeout;
//    Fetch data
let data;
let offset = 80;
//    Columns
let columns = [];
let numberOfCols = Math.floor((window.innerWidth * 0.8) / minColWidth);
// History
let preserveHistory = false;
let backHistory = false;
let expandHistory = [];
// Likes
let likes = [];
if (
  window.localStorage.getItem("likes") &&
  window.localStorage.getItem("likes").length > 0
) {
  likes = window.localStorage.getItem("likes").split(",");
} else {
  likes = [];
}
// Theme
let theme = "light";
if (window.localStorage.getItem("theme")) {
  theme = window.localStorage.getItem("theme");
}

function emptyColumns() {
  columns.forEach((col) => {
    col.querySelectorAll(".item").forEach((item) => {
      item.remove();
    });
    col.innerHTML = "";
  });
}

/**
 * * Elements
 */

// Header
const header = select("#header");
const El_searchInput = select("#searchInput");
const El_toggleTheme = select("#toggleTheme");
const Btn_favorites = select("#favorites");
const mobileSearchIcon = select("#mobileSearchIcon");
// Body
const overlay = select("#overlay");
const mainContainer = select("#mainContainer");
const resultsInfo = select("#resultsInfo");
const nothing = select("#nothing");
const prevHistory = select("#prevHistory");
// Footer
const footerLoading = select("#footer-loading--container");

/**
 * * Mobile Search Button
 */

mobileSearchIcon.addEventListener("click", () => {
  if (document.body.classList.contains("MOBILE_SEARCH")) {
    document.body.classList.remove("MOBILE_SEARCH");
    setTimeout(() => {
      El_searchInput.style.display = "none";
    }, 300);
  } else {
    El_searchInput.style.display = "flex";
    setTimeout(() => {
      document.body.classList.add("MOBILE_SEARCH");
      El_searchInput.focus();
    }, 50);
  }
});

/**
 * * Toggle Theme
 */

El_toggleTheme.addEventListener("click", () => {
  icon = El_toggleTheme.dataset.icon;
  if (icon === "brightness_3") {
    window.localStorage.setItem("theme", "dark");
    El_toggleTheme.style.color = "transparent";
    setTimeout(() => {
      El_toggleTheme.style.color = "#bbb";
      El_toggleTheme.dataset.icon = "light_mode";
    }, 300);
    setDarkTheme(true);
  } else {
    window.localStorage.setItem("theme", "light");
    El_toggleTheme.style.color = "transparent";
    setTimeout(() => {
      El_toggleTheme.style.color = "#222";
      El_toggleTheme.dataset.icon = "brightness_3";
    }, 300);
    setDarkTheme(false);
  }
});
if (theme === "dark") {
  El_toggleTheme.style.color = "transparent";
  setTimeout(() => {
    El_toggleTheme.style.color = "#bbb";
    El_toggleTheme.dataset.icon = "light_mode";
  }, 300);
  setDarkTheme(true);
}

/**
 * * Favorites List
 */
Btn_favorites.addEventListener("click", () => {
  document.body.classList.remove("EXPANDED");
  El_searchInput.value = "";
  let newData;
  showFooterLoading(true);
  isLoading = true;
  emptyColumns();
  if (Btn_favorites.classList.contains("active")) {
    isShowingFavorites = false;
    document.body.classList.remove("FAVORITES");
    Btn_favorites.classList.remove("active");
    Btn_favorites.dataset.icon = "bookmark_border";
    Btn_favorites.innerHTML = "Show saves";
    newData = data;
  } else {
    isShowingFavorites = true;
    document.body.classList.add("FAVORITES");
    Btn_favorites.classList.add("active");
    Btn_favorites.dataset.icon = "bookmark";
    Btn_favorites.innerHTML = "Hide saves";
    newData = data.filter((item) => likes.includes(item["page_id"]));
  }
  if (newData.length > 0) {
    resultsInfo.innerHTML = "";
    addItem(newData, columns, searchResultsCount);
    nothing.style.display = "none";
  } else {
    resultsInfo.innerHTML =
      '<p style="margin-top: 5%; margin-bottom: -5%;width: 100%; text-align: center">First add some products to favorites</p>';
    showFooterLoading(false);
    nothing.style.display = "flex";
  }
});

/**
 * * Populating the HTML
 */

// History Logic
function changeHistory(comand, id = null) {
  /**
   * @param comand add | remove | clear
   */
  if (comand === "add") {
    if (id === null) throw 'id not included in "add" mode';
    else expandHistory.push(id);
  } else if (comand === "remove") {
    expandHistory.pop();
  } else if (comand === "clear") {
    expandHistory = [];
  }

  if (expandHistory.length > 1) {
    document.body.classList.add("HISTORY");
  } else {
    document.body.classList.remove("HISTORY");
  }
}
prevHistory.addEventListener("click", (ev) => {
  changeHistory("remove");
  preserveHistory = true;
  document.querySelector(".item.expanded .closeBtn").click();
  setTimeout(() => {
    backHistory = true;
    document.getElementById(expandHistory[expandHistory.length - 1]).click();
  }, 300);
});

window.onresize = (ev) => {
  if (windowWidth === window.innerWidth) return;
  windowWidth = window.innerWidth;
  setMinColWidth();
  numberOfCols = Math.floor((windowWidth * 0.8) / minColWidth);
  columns = [];
  mainContainer.innerHTML = "";
  for (let i = 0; i < numberOfCols; i++) {
    const div_col = document.createElement("div");
    div_col.setAttribute("class", "col");
    div_col.style.width = 94 / numberOfCols + "%";
    columns.push(div_col);
    mainContainer.appendChild(div_col);
  }
  addItem(data, columns, addedItems);
};
// Creating Columns
for (let i = 0; i < numberOfCols; i++) {
  const div_col = document.createElement("div");
  div_col.setAttribute("class", "col");
  div_col.style.width = 94 / numberOfCols + "%";
  columns.push(div_col);
  mainContainer.appendChild(div_col);
}

// Add Similars
function addSimilars(container, data, closeElement) {
  let interval;
  let i = 0;
  let elements = [];
  let scrollX = 0;
  const div_grid = document.createElement("div");
  div_grid.setAttribute("class", "similar-grid");
  const div_scrollLeft = document.createElement("div");
  div_scrollLeft.setAttribute("class", "similar-scrollLeft");
  const div_scrollRight = document.createElement("div");
  div_scrollRight.setAttribute("class", "similar-scrollRight");
  div_grid.appendChild(div_scrollLeft);
  div_grid.appendChild(div_scrollRight);
  div_scrollRight.addEventListener("click", () => {
    if (scrollX + 320 > div_grid.scrollWidth - div_grid.offsetWidth)
      scrollX = div_grid.scrollWidth - div_grid.offsetWidth;
    else scrollX += 320;
    div_grid.scrollLeft = scrollX;
  });
  div_scrollLeft.addEventListener("click", () => {
    if (scrollX - 320 < 0) scrollX = 0;
    else scrollX -= 320;
    div_grid.scrollLeft = scrollX;
  });

  data.forEach((item) => {
    const div_element = document.createElement("div");
    div_element.setAttribute("class", "similar-item");
    div_element.setAttribute("title", item["name"]);
    div_element.style.backgroundImage = `url(${item["image_url"]})`;
    div_element.style.backgroundSize = "cover";
    div_element.style.backgroundPosition = "center";
    div_element.addEventListener("click", () => {
      div_element.style.transform = "scale(2)";
      preserveHistory = true;
      closeElement.click();
      setTimeout(() => {
        document.getElementById(item["page_id"]).click();
      }, 300);
    });

    elements.push(div_element);
    div_grid.appendChild(div_element);
  });
  container.appendChild(div_grid);
  interval = setInterval(() => {
    if (i === elements.length - 1) clearInterval(interval);
    elements[i].classList.add("active");
    i++;
  }, 100);
}
// Load Similar Products
function loadSimilars(container, refrence, closeElement) {
  /**
   * @param container     :element  |   section_similar element
   * @param refrence      :object   |   single data object
   * @param closeElement  :element  |   close button for container element
   */
  let similars;

  const pInfo = refrence["type"];

  let similar = { 0: [], 1: [], 2: [], 3: [] };
  //-----------------
  data.map((item) => {
    let score = 0;
    let isType = false;
    let isColor = false;
    let isMaterial = false;
    let isStyle = false;
    let itemInfo = item["type"];
    if (itemInfo["type"].length > 0)
      itemInfo["type"].forEach((word) => {
        if (pInfo["type"].includes(word)) {
          isType = true;
        }
      });
    if (isType) {
      itemInfo["color"].forEach((word) => {
        if (pInfo["color"].includes(word)) {
          isColor = true;
        }
      });
      itemInfo["material"].forEach((word) => {
        if (pInfo["material"].includes(word)) {
          isMaterial = true;
        }
      });
      itemInfo["styleType"].forEach((word) => {
        if (pInfo["styleType"].includes(word)) {
          isStyle = true;
        }
      });

      if (isColor) score++;
      if (isMaterial) score++;
      if (isStyle) score++;

      if (score === 3) {
        similar[3].push(item);
      } else if (score === 2) {
        similar[2].push(item);
      } else if (score === 1) {
        similar[1].push(item);
      } else {
        similar[0].push(item);
      }
    }

    similars = similar[3].concat(similar[2], similar[1], similar[0]);
    if (similars.length > 8) similars = similars.slice(0, 8);
  });
  if (similars.length > 0) {
    addSimilars(container, similars, closeElement);
    container.classList.add("active");
  }
}

// Adding items to #mainContainer
function addItem(ref, columns, count) {
  /**
   * @param ref         :array    |   the data to display
   * @param columns     :array    |   columns array to select automatically
   * @param count       :integer  |   displayed elements count
   */

  // * Creating div.item
  const img = new Image();
  img.src = ref[count]["image_url"];
  img.setAttribute("class", "mainImageTag");

  const div_imgBG = document.createElement("div");
  div_imgBG.setAttribute("class", "mainImage");
  div_imgBG.style.backgroundImage = `url(${ref[count]["image_url"]})`;

  const div_item = document.createElement("div");
  div_item.id = ref[count]["page_id"];
  div_item.setAttribute("class", "item");
  // * Article Container
  const article_container = document.createElement("article");
  article_container.setAttribute("class", "container");
  // * Info Container
  const div_info = document.createElement("div");
  div_info.setAttribute("class", "info");
  // * Title
  const h3_title = document.createElement("h3");
  h3_title.setAttribute("class", "title");
  h3_title.innerHTML = ref[count]["name"];
  // * Crawled Time
  const span_time = document.createElement("span");
  span_time.setAttribute("class", "crawledTime");
  span_time.innerHTML = dateToString(ref[count]["crawled_time"]);
  // * Description
  const p_des = document.createElement("p");
  p_des.setAttribute("class", "description");
  p_des.innerHTML = ref[count]["description"];
  // * Click to Expand text
  const div_more = document.createElement("div");
  div_more.setAttribute("class", "readMore");
  div_more.innerHTML = "Click to expand";
  // * Close Button
  const div_close = document.createElement("div");
  div_close.setAttribute("class", "closeBtn");
  div_close.innerHTML = "close";
  // * Price
  const p_price = document.createElement("p");
  p_price.setAttribute("class", "price");
  p_price.innerHTML = ref[count]["price"];
  // * Similar Products
  const section_similar = document.createElement("section");
  section_similar.setAttribute("class", "similar-container");
  section_similar.innerHTML = "<h4>Similar Products</h4>";
  // * Domain
  const a_domain = document.createElement("a");
  a_domain.setAttribute("class", "domain");
  a_domain.href = ref[count]["canonical_url"];
  a_domain.innerHTML = `<span>${ref[count]["domain"]}</span>`;
  // * Domain
  const btn_like = document.createElement("button");
  btn_like.setAttribute("class", "like");
  btn_like.setAttribute("title", "Save");
  if (likes.includes(ref[count]["page_id"])) btn_like.classList.add("LIKED");

  div_info.appendChild(h3_title);
  div_info.appendChild(span_time);
  div_info.appendChild(p_des);
  div_info.appendChild(p_price);
  div_info.appendChild(div_more);
  div_info.appendChild(section_similar);
  div_info.appendChild(a_domain);
  div_info.appendChild(btn_like);

  article_container.appendChild(div_close);
  article_container.appendChild(div_imgBG);
  article_container.appendChild(img);
  article_container.appendChild(div_info);

  div_item.appendChild(article_container);

  // * Like Event
  btn_like.addEventListener("click", (ev) => {
    ev.preventDefault();
    if (btn_like.classList.contains("LIKED")) {
      if (likes.includes(ref[count - 1]["page_id"])) {
        likes.splice(likes.indexOf(ref[count - 1]["page_id"]), 1);
        window.localStorage.setItem("likes", likes);
        btn_like.classList.remove("LIKED");
      }
    } else {
      if (!likes.includes(ref[count - 1]["page_id"])) {
        likes.push(ref[count - 1]["page_id"]);
        window.localStorage.setItem("likes", likes);
        btn_like.classList.add("LIKED");
      }
    }
  });

  // * On Click | Expand
  div_item.addEventListener("click", (ev) => {
    if (div_item.classList.contains("expanded")) return; // return if already expanded
    if (ev.target.classList.contains("domain")) return; // return if link
    else if (ev.target.classList.contains("like")) return; // return if like

    clearTimeout(similarsTimeout);
    document.body.classList.add("EXPANDED");
    if (!backHistory) changeHistory("add", ref[count - 1]["page_id"]);
    backHistory = false;

    div_imgBG.style.opacity = 0;
    div_info.style.opacity = 0;
    div_close.style.opacity = 0;
    prevHistory.style.opacity = 0;

    setTimeout(() => {
      div_item.classList.add("expanded");

      div_imgBG.style.transition = "all 0s";
      div_imgBG.style.transform = "translateX(-25px)";
      img.style.transition = "all 0s";
      img.style.transform = "translateX(-25px)";
      div_info.style.transition = "all 0s";
      div_info.style.transform = "translateX(25px)";
      div_close.style.transition = "all 0s";
      div_close.style.transform = "translateX(25px)";
      prevHistory.style.transition = "all 0s";
      prevHistory.style.transform = "translateX(25px)";

      setTimeout(() => {
        div_imgBG.style.transition = "all 0.5s ease-in-out";
        img.style.transition = "all 0.5s ease-in-out";
        div_info.style.transition = "all 0.5s ease-in-out";
        div_close.style.transition = "all 0.5s ease-in-out";
        prevHistory.style.transition = "all 0.5s ease-in-out";

        div_imgBG.style.opacity = 1;
        div_imgBG.style.transform = "translateX(0)";
        img.style.opacity = 1;
        img.style.transform = "translateX(0)";
        div_info.style.transform = "translateX(0)";
        div_info.style.opacity = 1;
        div_close.style.transform = "translateX(0)";
        div_close.style.opacity = 1;
        prevHistory.style.transform = "translateX(0)";
        prevHistory.style.opacity = 1;

        similarsTimeout = setTimeout(() => {
          loadSimilars(section_similar, ref[count - 1], div_close);
        }, 500);
      }, 50);
    }, 300);
  });
  // * Close
  div_close.addEventListener("click", () => {
    if (!preserveHistory) changeHistory("clear");
    preserveHistory = false;
    document.body.classList.remove("EXPANDED");

    div_imgBG.style.opacity = 0;
    div_imgBG.style.transform = "translateX(-25px)";
    img.style.opacity = 0;
    img.style.transform = "translateX(-25px)";
    div_info.style.opacity = 0;
    div_info.style.transform = "translateX(25px)";
    div_close.style.opacity = 0;
    div_close.style.transform = "translateX(25px)";
    prevHistory.style.opacity = 0;
    prevHistory.style.transform = "translateX(25px)";

    setTimeout(() => {
      div_item.classList.remove("expanded");

      div_imgBG.style.transition = "all 0s";
      img.style.transition = "all 0s";
      div_info.style.transition = "all 0s";
      div_close.style.transition = "all 0s";
      prevHistory.style.transition = "all 0s";

      div_imgBG.style.transform = "translateX(0)";
      img.style.transform = "translateX(0)";
      div_info.style.transform = "translateX(0)";
      div_close.style.transform = "translateX(0)";
      prevHistory.style.transform = "translateX(0)";

      setTimeout(() => {
        div_imgBG.style.transition = "all 0.3s ease-in-out";
        img.style.transition = "all 0.3s ease-in-out";
        div_info.style.transition = "all 0.3s ease-in-out";
        div_close.style.transition = "all 0.3s ease-in-out";
        prevHistory.style.transition = "all 0.3s ease-in-out";

        div_imgBG.style.opacity = 1;
        img.style.opacity = 1;
        div_info.style.opacity = "";
        div_close.style.opacity = "";
        prevHistory.style.opacity = "";
      }, 50);
      section_similar.classList.remove("active");
      section_similar.querySelectorAll(".similar-item").forEach((item) => {
        item.remove();
      });
    }, 300);
  });

  // * Select Column
  let minHeight = null;
  let theCol;
  try {
    img.onload = function () {
      div_item.style.minHeight =
        (columns[0].offsetWidth / img.width) * img.height + "px"; // So the height doesn't depend on the image anymore
      div_imgBG.style.aspectRatio = `${img.width}/${img.height}`;
      columns.forEach((col) => {
        if (minHeight === null) {
          minHeight = col.offsetHeight;
          theCol = col;
        } else {
          if (col.offsetHeight < minHeight) {
            minHeight = col.offsetHeight;
            theCol = col;
          }
        }
      });

      // * If search query exists
      if (isSearching) {
        if (
          ref[count]["description"]
            .toLowerCase()
            .includes(El_searchInput.value.toLowerCase())
        ) {
          theCol.appendChild(div_item);
        }
      } else if (isShowingFavorites) {
        if (likes.includes(ref[count]["page_id"])) {
          theCol.appendChild(div_item);
        }
      } else {
        theCol.appendChild(div_item);
      }

      // Repeat
      count++;
      if (count < ref.length) addItem(ref, columns, count);
      else {
        clearTimeout(loadingTimeout);
        loadingTimeout = setTimeout(() => {
          showFooterLoading(false);
        }, 500);
        isLoading = false;
      }
      // Show item
      setTimeout(() => {
        showItem(div_item);
      }, 300);
    };
    img.onerror = () => {
      console.log("Skipping the image. Server-Side ERROR");
      count++;
      if (count < ref.length) addItem(ref, columns, count);
      else {
        clearTimeout(loadingTimeout);
        loadingTimeout = setTimeout(() => {
          showFooterLoading(false);
        }, 500);
        isLoading = false;
      }
    };
  } catch {
    // Repeat
    count++;
    if (count < ref.length) addItem(ref, columns, count);
    else {
      clearTimeout(loadingTimeout);
      loadingTimeout = setTimeout(() => {
        showFooterLoading(false);
      }, 500);
      isLoading = false;
    }
  }
}

/**
 * * First Data Fetch
 */
let i = 0;
showFooterLoading(true);
fetch("https://xoosha.com/ws/1/test.php?offset=20")
  .then((res) => res.json())
  .then((newData) => {
    data = newData.map((product) => {
      let type = productType(product);
      product["type"] = type;
      return product;
    });

    addItem(data, columns, addedItems);
  });

/**
 * * Search
 */

El_searchInput.addEventListener("focusout", (ev) => {
  if (ev.target.value === "") {
    isSearching = false;
    document.body.classList.remove("SEARCHING");
  }
});
El_searchInput.addEventListener("input", (ev) => {
  if (Btn_favorites.classList.contains("active")) {
    isShowingFavorites = false;
    document.body.classList.remove("FAVORITES");
    Btn_favorites.classList.remove("active");
    Btn_favorites.dataset.icon = "bookmark_border";
    Btn_favorites.innerHTML = "Show saves";
    newData = data;
  }
  isSearching = true;
  document.body.classList.remove("EXPANDED");
  document.body.classList.add("SEARCHING");
  if (ev.target.value == "") {
    isSearching = false;
    document.body.classList.remove("SEARCHING");
  }
  clearTimeout(refreshTimeout);
  showFooterLoading(true);
  emptyColumns();
  refreshTimeout = setTimeout(() => {
    let newData = data.filter((item) =>
      item["description"].toLowerCase().includes(ev.target.value.toLowerCase())
    );
    if (newData.length > 0) {
      resultsInfo.innerHTML =
        ev.target.value == "" ? "" : `${newData.length} Results found`;

      addItem(newData, columns, searchResultsCount);
      nothing.style.display = "none";
      mainContainer.style.display = "flex";
    } else {
      resultsInfo.innerHTML = "";
      showFooterLoading(false);
      nothing.style.display = "flex";
      mainContainer.style.display = "none";
    }
  }, searchDelay);
});
// Ctrl+K
document.addEventListener("keydown", (ev) => {
  if (ev.ctrlKey && ev.key === "k") {
    ev.preventDefault();
    El_searchInput.focus();
  }
});

/**
 * * Infinite Scroll
 */

document.addEventListener("scroll", (ev) => {
  let bodyHeight = document.body.offsetHeight;
  if (
    !isSearching &&
    !isShowingFavorites &&
    !isLoading &&
    bodyHeight - window.scrollY < window.innerHeight + 200
  ) {
    isLoading = true;
    showFooterLoading(true);
    fetch(`https://xoosha.com/ws/1/test.php?offset=${offset}`)
      .then((res) => res.json())
      .then((newData) => {
        offset += 60;
        let postProcessData = newData.map((product) => {
          let type = productType(product);
          product["type"] = type;
          return product;
        });

        data = data.concat(postProcessData);

        addItem(data, columns, addedItems);
      });
  }
});
