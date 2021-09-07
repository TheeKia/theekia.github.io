class Input {
  static DRS_INPUTS = [];

  constructor(parent) {
    try {
      this.parent = parent;
      this.input = parent.querySelector("input")
        ? parent.querySelector("input")
        : parent.querySelector("button");
      this.label = parent.querySelector("label");
    } catch (err) {
      console.log(err);
      return;
    }
    Input.DRS_INPUTS.push(this);
  }

  static darkThemeAll(TF = true) {
    if (TF) {
      Input.DRS_INPUTS.forEach((input) => {
        if (!input.parent.classList.contains("drs-darkTheme")) {
          input.parent.classList.add("drs-darkTheme");
        }
      });
    } else {
      Input.DRS_INPUTS.forEach((input) => {
        if (input.parent.classList.contains("drs-darkTheme")) {
          input.parent.classList.remove("drs-darkTheme");
        }
      });
    }
  }

  darkTheme(TF = true) {
    if (TF) {
      if (!this.parent.classList.contains("drs-darkTheme")) {
        this.parent.classList.add("drs-darkTheme");
      }
    } else {
      if (this.parent.classList.contains("drs-darkTheme")) {
        this.parent.classList.remove("drs-darkTheme");
      }
    }
  }
}

class TInput extends Input {
  constructor(parent) {
    super(parent);

    if (!this.parent.classList.contains("tInput")) {
      this.parent.classList.add("tInput");
    }

    if (!this.input) {
      console.warn("Something went wrong in Input Class", this.parent);
      return;
    } else if (!this.label) {
      this.parent.classList.add("NOLABEL");
    }

    if (this.input.value.length > 0) {
      this.active();
    }
    this.input.addEventListener("focus", () => {
      this.active();
    });
    this.input.addEventListener("focusout", () => {
      this.deactive();
    });

    // Detecting if Autofilled
    this.input.addEventListener("animationstart", (e) => {
      if (e.animationName === "autofilled") {
        this.autofill();
      }
    });
    this.input.addEventListener("animationstart", (e) => {
      if (e.animationName === "noAutofill") {
        this.removeAutofill();
      }
    });
    this.input.addEventListener("input", () => {
      if (this.input.value.length > 0) {
        this.active();
      }
    });
  }

  active() {
    if (!this.parent.classList.contains("ACTIVE")) {
      this.parent.classList.add("ACTIVE");
    }
  }
  deactive() {
    if (this.input.value.length === 0) {
      this.parent.classList.remove("ACTIVE", "AUTOFILL");
    }
  }
  autofill(value = null) {
    this.active();
    if (!this.parent.classList.contains("AUTOFILL")) {
      this.parent.classList.add("AUTOFILL");
    }
    if (value) {
      this.input.value = value;
    }
  }
  removeAutofill() {
    if (this.parent.classList.contains("AUTOFILL")) {
      this.parent.classList.remove("AUTOFILL");
    }
  }
}

class CInput extends Input {
  constructor(parent) {
    super(parent);

    if (!this.parent.classList.contains("cInput")) {
      this.parent.classList.add("cInput");
    }

    this.createLabelBox();
  }
  createLabelBox() {
    let span = document.createElement("span");
    span.setAttribute("class", "cr-box");
    span.innerHTML =
      '<svg viewBox="0 0 78.6 62.85"><polyline pathLength="50" points="4.95 32.25 25.65 52.95 73.65 4.95"/></svg>';
    this.label.prepend(span);
  }
}
class RInput extends Input {
  constructor(parent) {
    super(parent);

    if (!this.parent.classList.contains("rInput")) {
      this.parent.classList.add("rInput");
    }

    this.createLabelBox();
  }

  createLabelBox() {
    let span = document.createElement("span");
    span.setAttribute("class", "cr-box");
    this.label.prepend(span);
  }
}

class FInput extends Input {
  constructor(parent) {
    super(parent);

    if (!this.parent.classList.contains("fInput")) {
      this.parent.classList.add("fInput");
    }

    this.defaultLabel = this.label.innerHTML;

    this.initiate();

    if (
      this.parent.dataset.expand &&
      document.getElementById(this.parent.dataset.expand)
    ) {
      this.expand = true;
      this.expandElement = document.getElementById(this.parent.dataset.expand);
      this.expandElement.classList.add("fI-expand");
      this.expandElement.innerHTML = "";
    } else {
      if (this.parent.dataset.expand) {
        console.warn(
          `The expand element of File Input not exists. No element by ID: ${this.parent.dataset.expand}`
        );
      }
      this.expand = false;
      this.expandElement = null;
    }
  }

  initiate() {
    this.input.addEventListener("input", () => {
      let files = this.input.files;

      if (this.expand) {
        this.expandElement.innerHTML = "";
      }

      if (files.length > 1) {
        // Multiple files selected
        this.activate();

        let totalSize = 0;
        for (let file of files) {
          totalSize += file.size;
        }
        totalSize = this.formatSize(totalSize);

        this.label.innerHTML = `${files.length} files <span class='fI-detail'>${totalSize}</span>`;

        if (this.expand) {
          for (let file of files) {
            let p = document.createElement("p");
            let size = this.formatSize(file.size);
            p.innerHTML = `${file.name} <span class='fI-detail'>${size}</span>`;
            this.expandElement.appendChild(p);
          }
        }
      } else if (files.length === 1) {
        // One file selected
        this.activate();

        let originalName = files[0].name;
        // Size handling
        let size = this.formatSize(files[0].size);

        if (this.expand) {
          let p = document.createElement("p");
          p.innerHTML = `${originalName} <span class='fI-detail'>${size}</span>`;
          this.expandElement.innerHTML = "";
          this.expandElement.appendChild(p);

          this.label.innerHTML = `1 file <span class='fI-detail'>${size}</span>`;
        } else {
          // Short name handling
          let name = "";
          this.label.title = originalName;
          if (originalName.length > 25) {
            name =
              originalName.slice(0, 16) +
              "..." +
              originalName.slice(name.length - 6);
          } else {
            name = originalName;
          }

          this.label.innerHTML = `${name} <span class='fI-detail'>${size}</span>`;
        }
      } else {
        // Nothing selected
        this.deactivate();
        this.label.innerHTML = this.defaultLabel;
        if (this.expand) {
          this.expandElement.innerHTML = "";
        }
      }
    });
  }

  activate() {
    if (!this.parent.classList.contains("active")) {
      this.parent.classList.add("active");
    }
  }
  deactivate() {
    if (this.parent.classList.contains("active")) {
      this.parent.classList.remove("active");
    }
  }

  formatSize(size) {
    const unit = ["B", "KB", "MB", "GB", "TB"];
    let unitIndex = 0;
    while (size >= 1000) {
      size /= 1000;
      unitIndex++;
    }
    size = size.toString().slice(0, 3);
    return size + unit[unitIndex];
  }
}

class BInput extends Input {
  constructor(parent) {
    super(parent);

    if (!this.parent.classList.contains("bInput")) {
      this.parent.classList.add("bInput");
    }

    this.isProgressSet = false;

    // Icon Only
    if (
      this.label.innerHTML === "" &&
      this.label.dataset.icon.length > 0 &&
      !this.parent.classList.contains("drs-bInput--IconOnly")
    ) {
      this.parent.classList.add("drs-bInput--IconOnly");
    }

    // Click Pend
    if (this.parent.classList.contains("drs-clickPend")) {
      this.input.addEventListener("click", () => {
        this.pend();
      });
    }
  }

  pend() {
    this.parent.classList.add("PENDING");
    this.input.disabled = true;
    return this;
  }
  unpend() {
    this.parent.classList.remove("PENDING");
    this.input.disabled = false;
    return this;
  }

  progress(tenths) {
    if (tenths !== false) {
      if (this.isProgressSet === false) {
        this.progressElement = document.createElement("div");
        this.progressElement.setAttribute("class", "bInput-progressbar");
        this.label.appendChild(this.progressElement);
        this.isProgressSet = true;
      }
      this.progressElement.style.transform = `scaleX(${tenths})`;
    } else {
      if (this.isProgressSet === true) {
        this.isProgressSet = false;
        this.progressElement.remove();
      }
      this.unpend();
    }
  }

  setStatus(status) {
    if (status != "success" && status != "fail") {
      console.log(`Wrong status code. ${status} status code does not exists.`);
      return;
    }
    status = status.toUpperCase();
    this.parent.classList.remove("PENDING");
    this.parent.classList.add(status);
    setTimeout(() => {
      this.parent.classList.remove(status);
      this.input.disabled = false;
    }, 1000);
    return this;
  }

  onClick(fn, pend = false) {
    this.input.addEventListener("click", () => {
      if (pend) this.pend();
      fn();
    });
    return this;
  }

  async fetch(
    url,
    method = "GET",
    data = {},
    contentType = "application/json"
  ) {
    if (method === "GET" || method === "HEAD") {
      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": contentType,
        },
      });
      return response;
    } else {
      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": contentType,
        },
        body: JSON.stringify(data),
      });
      return response;
    }
  }
}
