const hamburger = document.getElementById('hamburger');
const sidebar = document.getElementById('sidebar');
const mainContent = document.getElementById('mainContent');

function toggleSidebar() {
    const isOpen = sidebar.classList.toggle('open');
    hamburger.classList.toggle('active');
    mainContent.classList.toggle('sidebar-open');
    if (window.innerWidth >= 769) {
        document.body.classList.toggle('sidebar-closed', !isOpen);
    }
}

hamburger.addEventListener('click', toggleSidebar);

document.addEventListener('click', function (e) {
    if (window.innerWidth < 769) {
        const isClickInside = sidebar.contains(e.target) || hamburger.contains(e.target);
        if (!isClickInside && sidebar.classList.contains('open')) {
            toggleSidebar();
        }
    }
});

// ----- NAVIGATION -----
const navLinks = document.querySelectorAll('.sidebar nav a[data-section]');
const sections = {
    home: document.getElementById('home'),
    about: document.getElementById('about'),
    skills: document.getElementById('skills'),
    blog: document.getElementById('blog'),
    contact: document.getElementById('contact'),
};

document.querySelectorAll('[data-nav]').forEach(link => {
    link.addEventListener('click', function (e) {
        e.preventDefault();
        const target = this.getAttribute('data-nav');
        switchSection(target);
        if (window.innerWidth < 769 && sidebar.classList.contains('open')) {
            toggleSidebar();
        }
    });
});

function switchSection(sectionId) {
    Object.values(sections).forEach(sec => sec.classList.remove('active'));
    if (sections[sectionId]) sections[sectionId].classList.add('active');
    navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('data-section') === sectionId);
    });
    history.pushState(null, '', '#' + sectionId);
}

navLinks.forEach(link => {
    link.addEventListener('click', function (e) {
        e.preventDefault();
        const sectionId = this.getAttribute('data-section');
        switchSection(sectionId);
        if (window.innerWidth < 769 && sidebar.classList.contains('open')) {
            toggleSidebar();
        }
    });
});

window.addEventListener('hashchange', function () {
    const hash = location.hash.replace('#', '') || 'home';
    if (sections[hash]) switchSection(hash);
});

(function initFromHash() {
    const hash = location.hash.replace('#', '') || 'home';
    if (sections[hash]) switchSection(hash);
    else switchSection('home');
})();

// ----- CONTACT FORM (AJAX) -----
const contactForm = document.getElementById('contactForm');
const feedback = document.getElementById('formFeedback');

contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const message = document.getElementById('message').value.trim();
    const agree = document.getElementById('agree').checked;

    feedback.className = '';
    feedback.style.display = 'block';

    // Validation
    if (!name || name.length < 2) {
        feedback.className = 'error';
        feedback.innerHTML = '<p style="color:#f87171;">❌ Please enter your full name (min 2 characters).</p>';
        return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        feedback.className = 'error';
        feedback.innerHTML = '<p style="color:#f87171;">❌ Please enter a valid email address.</p>';
        return;
    }
    if (!message || message.length < 10) {
        feedback.className = 'error';
        feedback.innerHTML = '<p style="color:#f87171;">❌ Message must be at least 10 characters.</p>';
        return;
    }
    if (!agree) {
        feedback.className = 'error';
        feedback.innerHTML = '<p style="color:#f87171;">❌ You must agree to the privacy policy.</p>';
        return;
    }

    const submitBtn = contactForm.querySelector('.btn-submit');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    try {
        // Use the backend URL (adjust if you deploy elsewhere)
        const API_URL = 'http://localhost:5000/api/contact';

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, message }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
            feedback.className = 'success';
            feedback.innerHTML = `
                        <p style="color:#34d399;">✅ ${data.message}</p>
                        <p style="margin-top:10px;">
                            <a href="${data.whatsappLink}" target="_blank" style="color:var(--accent-1); text-decoration:underline;">
                                📱 Click here to chat on WhatsApp
                            </a>
                        </p>
                        <p style="font-size:14px; color:var(--text-muted);">A confirmation email has been sent to your inbox.</p>
                    `;
            contactForm.reset();
        } else {
            const errMsg = data.errors ? data.errors.join(', ') : data.message || 'Something went wrong.';
            feedback.className = 'error';
            feedback.innerHTML = `<p style="color:#f87171;">❌ ${errMsg}</p>`;
        }
    } catch (err) {
        console.error('Fetch error:', err);
        feedback.className = 'error';
        feedback.innerHTML = `
                    <p style="color:#f87171;">❌ Cannot reach the server. Make sure the backend is running on <strong>http://localhost:5000</strong></p>
                    <p style="font-size:14px; color:var(--text-muted);">Try: <code>cd your-project && node server.js</code></p>
                `;
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
});

// ----- ANIMATE SKILL BARS ON VIEW -----
const skillBars = document.querySelectorAll('.skill-bar');
let skillAnimated = false;

function animateSkillBars() {
    if (skillAnimated) return;
    const skillsSection = document.getElementById('skills');
    if (!skillsSection.classList.contains('active')) return;
    skillBars.forEach(bar => {
        const target = bar.style.width;
        bar.style.width = '0%';
        setTimeout(() => { bar.style.width = target; }, 200);
    });
    skillAnimated = true;
}

const observer = new MutationObserver(() => {
    const skillsSection = document.getElementById('skills');
    if (skillsSection.classList.contains('active') && !skillAnimated) {
        animateSkillBars();
    }
});
Object.values(sections).forEach(sec => observer.observe(sec, { attributes: true, attributeFilter: ['class'] }));

if (document.getElementById('skills').classList.contains('active')) {
    animateSkillBars();
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar.classList.contains('open')) {
        toggleSidebar();
    }
});

console.log('✅ Portfolio ready – contact form will work once the backend server is running.');
