/* =========================================================
   ИСКУССТВО РАЗУМА — ОБЩИЙ JAVASCRIPT
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =========================
       MOBILE MENU
       ========================= */
    const menuToggle = document.querySelector(".mobile-menu-toggle");
    const nav = document.querySelector("header nav");

    if (menuToggle && nav) {
        const closeMenu = () => {
            menuToggle.classList.remove("active");
            nav.classList.remove("mobile-open");
            menuToggle.setAttribute("aria-expanded", "false");
            menuToggle.setAttribute("aria-label", "Открыть меню");
        };

        menuToggle.addEventListener("click", () => {
            const isOpen = menuToggle.classList.toggle("active");
            nav.classList.toggle("mobile-open", isOpen);
            menuToggle.setAttribute("aria-expanded", String(isOpen));
            menuToggle.setAttribute("aria-label", isOpen ? "Закрыть меню" : "Открыть меню");
        });

        nav.querySelectorAll("a").forEach(link => link.addEventListener("click", closeMenu));

        window.addEventListener("resize", () => {
            if (window.innerWidth > 768) closeMenu();
        });
    }


    /* =========================
       MOBILE COURSE FILTER
       ========================= */
    const filterToggle = document.querySelector(".mobile-filter-toggle");
    const filters = document.querySelector(".filters");
    const filtersBackdrop = document.querySelector(".filters-backdrop");
    const filtersClose = document.querySelector(".filters-close");

    const closeFilters = () => {
        document.body.classList.remove("filters-open");
        filters?.classList.remove("is-open");
        filterToggle?.classList.remove("active");
        filterToggle?.setAttribute("aria-expanded", "false");
    };

    const openFilters = () => {
        document.body.classList.add("filters-open");
        filters?.classList.add("is-open");
        filterToggle?.classList.add("active");
        filterToggle?.setAttribute("aria-expanded", "true");
    };

    filterToggle?.addEventListener("click", () => {
        if (filters?.classList.contains("is-open")) closeFilters();
        else openFilters();
    });

    filtersClose?.addEventListener("click", closeFilters);
    filtersBackdrop?.addEventListener("click", closeFilters);


    /* =========================
       SCROLL TO TOP
       ========================= */
    const scrollTopBtn = document.getElementById("scrollTopBtn");

    if (scrollTopBtn) {
        window.addEventListener("scroll", () => {
            scrollTopBtn.classList.toggle("show", window.scrollY > 500);
        }, { passive: true });

        scrollTopBtn.addEventListener("click", () => {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }


    /* =========================
       HERO SLIDER
       ========================= */
    const slides = document.querySelectorAll(".hero-slider .slide");
    const dots = document.querySelectorAll(".slider-dots .dot");
    const nextButton = document.querySelector(".hero-slider .slider-btn.next");
    const prevButton = document.querySelector(".hero-slider .slider-btn.prev");

    if (slides.length) {
        let current = 0;
        let timer = null;

        const showSlide = index => {
            current = (index + slides.length) % slides.length;

            slides.forEach((slide, i) => slide.classList.toggle("active", i === current));
            dots.forEach((dot, i) => dot.classList.toggle("active", i === current));
        };

        const restartTimer = () => {
            clearInterval(timer);
            timer = setInterval(() => showSlide(current + 1), 15000);
        };

        nextButton?.addEventListener("click", () => {
            showSlide(current + 1);
            restartTimer();
        });

        prevButton?.addEventListener("click", () => {
            showSlide(current - 1);
            restartTimer();
        });

        dots.forEach((dot, index) => {
            dot.addEventListener("click", () => {
                showSlide(index);
                restartTimer();
            });
        });

        const slider = document.querySelector(".hero-slider");
        let touchStartX = 0;
        let touchStartY = 0;

        slider?.addEventListener("touchstart", event => {
            const touch = event.changedTouches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
        }, { passive: true });

        slider?.addEventListener("touchend", event => {
            const touch = event.changedTouches[0];
            const deltaX = touch.clientX - touchStartX;
            const deltaY = touch.clientY - touchStartY;

            if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
                showSlide(current + (deltaX < 0 ? 1 : -1));
                restartTimer();
            }
        }, { passive: true });

        showSlide(0);
        restartTimer();
    }


    /* =========================
       COURSE FILTERS
       ========================= */
    const cards = document.querySelectorAll(".course-card");
    const filterButtons = document.querySelectorAll(".filter-btn");
    const resetFilters = document.querySelector(".reset-filters");

    if (cards.length && filterButtons.length) {
        let currentAge = "";
        let currentProgram = "";

        const filterCourses = () => {
            cards.forEach(card => {
                const ages = (card.dataset.age || "").split(",").map(v => v.trim());
                const ageMatch = currentAge === "" || ages.includes(currentAge);
                const programMatch = currentProgram === "" || card.dataset.program === currentProgram;

                card.classList.toggle("is-hidden", !(ageMatch && programMatch));
            });
        };

        filterButtons.forEach(button => {
            button.addEventListener("click", () => {
                const type = button.dataset.type;
                const value = button.dataset.value;
                const wasActive = button.classList.contains("active");

                document.querySelectorAll(`[data-type="${type}"]`).forEach(btn => btn.classList.remove("active"));

                if (wasActive) {
                    if (type === "age") currentAge = "";
                    if (type === "program") currentProgram = "";
                } else {
                    button.classList.add("active");
                    if (type === "age") currentAge = value;
                    if (type === "program") currentProgram = value;
                }

                filterCourses();
            });
        });

        resetFilters?.addEventListener("click", () => {
            currentAge = "";
            currentProgram = "";
            filterButtons.forEach(button => button.classList.remove("active"));
            filterCourses();
        });

        filterCourses();
    }

    /* =========================
       REGISTRATION / COURSE SELECT
       ========================= */
    const courseSelect = document.getElementById("courseSelect");
    const registerSection = document.getElementById("register");

    const selectCourse = courseValue => {
        if (!courseValue || !courseSelect) return;

        const option = [...courseSelect.options].find(item => item.value === courseValue);
        if (!option) return;

        courseSelect.value = courseValue;
        courseSelect.dispatchEvent(new Event("change", { bubbles: true }));
    };

    const goToRegistration = courseValue => {
        if (courseValue) {
            selectCourse(courseValue);
            try {
                sessionStorage.setItem("selectedCourse", courseValue);
            } catch (_) {}
        }

        if (registerSection) {
            registerSection.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
            window.location.href = `index.html?course=${encodeURIComponent(courseValue || "") }#register`;
        }
    };

    document.querySelectorAll(".open-course, .course-link").forEach(button => {
        button.addEventListener("click", event => {
            const courseValue = button.dataset.course || button.closest("[data-course]")?.dataset.course;
            if (!courseValue) return;

            event.preventDefault();
            goToRegistration(courseValue);
        });
    });

    if (courseSelect) {
        const params = new URLSearchParams(window.location.search);
        const urlCourse = params.get("course");
        let savedCourse = null;

        try {
            savedCourse = sessionStorage.getItem("selectedCourse");
        } catch (_) {}

        const selectedCourse = urlCourse || savedCourse;

        if (selectedCourse) {
            selectCourse(selectedCourse);
            try { sessionStorage.removeItem("selectedCourse"); } catch (_) {}

            if (urlCourse && registerSection && window.location.hash === "#register") {
                setTimeout(() => registerSection.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
            }
        }
    }


    /* =========================
       EXISTING COURSE MODAL SUPPORT
       ========================= */
    const legacyModal = document.getElementById("courseModal");

    if (legacyModal) {
        const closeModal = legacyModal.querySelector(".close-modal");
        const modalButton = legacyModal.querySelector(".modal-btn, #modalButton");

        const closeLegacyModal = () => {
            legacyModal.classList.remove("active");
            document.body.classList.remove("modal-open");

            const video = document.getElementById("modalVideo");
            if (video) {
                video.pause();
                video.currentTime = 0;
            }
        };


        closeModal?.addEventListener("click", closeLegacyModal);
        legacyModal.addEventListener("click", event => {
            if (event.target === legacyModal) closeLegacyModal();
        });
        modalButton?.addEventListener("click", event => {
            event.preventDefault();
            closeLegacyModal();
            goToRegistration();
        });
    }


    /* =========================
       DIPLOMAS / CERTIFICATES
       ========================= */
    window.openDiploma = function (id) {
        const popup = document.getElementById(id);
        if (!popup) return;
        popup.classList.add("show");
        document.body.style.overflow = "hidden";
    };

    window.closeDiploma = function (id) {
        const popup = document.getElementById(id);
        if (!popup) return;
        popup.classList.remove("show");
        document.body.style.overflow = "";
    };

    document.querySelectorAll(".diploma-popup").forEach(popup => {
        popup.addEventListener("click", event => {
            if (event.target === popup) window.closeDiploma(popup.id);
        });
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            document.querySelectorAll(".diploma-popup.show").forEach(popup => popup.classList.remove("show"));
            document.body.style.overflow = "";
            closeFilters();
        }
    });

    /* =========================
       PHONE — +7 FORMAT
       ========================= */
    const phoneInput = document.getElementById("phone");

    if (phoneInput) {
        const formatPhone = value => {
            let digits = String(value || "").replace(/\D/g, "");

            if (digits.startsWith("8")) digits = "7" + digits.slice(1);
            if (!digits.startsWith("7")) digits = "7" + digits;
            digits = digits.slice(0, 11);

            let result = "+7";
            const rest = digits.slice(1);

            if (rest.length > 0) result += " (" + rest.slice(0, 3);
            if (rest.length >= 3) result += ")";
            if (rest.length > 3) result += " " + rest.slice(3, 6);
            if (rest.length > 6) result += "-" + rest.slice(6, 8);
            if (rest.length > 8) result += "-" + rest.slice(8, 10);

            return result;
        };

        const ensurePhonePrefix = () => {
            if (!phoneInput.value || phoneInput.value === "8" || phoneInput.value === "+7") {
                phoneInput.value = "+7 (";
            } else {
                phoneInput.value = formatPhone(phoneInput.value);
            }
        };

        phoneInput.addEventListener("focus", ensurePhonePrefix);
        phoneInput.addEventListener("input", () => {
            phoneInput.value = formatPhone(phoneInput.value);
        });
        phoneInput.addEventListener("blur", ensurePhonePrefix);

        if (!phoneInput.value) phoneInput.value = "+7 (";
    }

    /* =========================
       REGISTRATION FORM -> PHP
       ========================= */
    const registerForm = document.getElementById("registerForm");

    if (registerForm) {
        registerForm.addEventListener("submit", async event => {
            event.preventDefault();

            const submitButton = registerForm.querySelector(".submit-btn");
            const originalText = submitButton?.textContent || "Отправить заявку";

            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = "Отправляем...";
            }

            try {
                const response = await fetch(registerForm.action, {
                    method: "POST",
                    body: new FormData(registerForm),
                    headers: { "Accept": "application/json" }
                });

                const result = await response.json();

                if (!response.ok || !result.success) {
                    throw new Error(result.message || "Не удалось отправить заявку.");
                }

                alert("Заявка отправлена! Мы свяжемся с вами.");
                registerForm.reset();

                if (phoneInput) phoneInput.value = "+7 (";
            } catch (error) {
                alert(error.message || "Произошла ошибка. Попробуйте ещё раз.");
            } finally {
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = originalText;
                }
            }
        });
    }


});
