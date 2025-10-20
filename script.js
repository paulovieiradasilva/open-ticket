const msgSucesso = document.getElementById('msg-sucesso');
const msgErro = document.getElementById('msg-erro');
const backdrop = document.getElementById('backdrop');

const destinatario = "indicainstalacoes@gmail.com";

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycby-vmnsfTVu-kTirS7309JGIXf6rte0q719yFmcND_Sfs8jUz37uzVwx0k1JgauR5Ur/exec";


(function validateForm() {
    $("#contato-form").validate({
        rules: {
            nome: "required",
            celular: "required",
            email: {
                required: true,
                email: true
            },
            tipo: "required",
            endereco: "required",
            mensagem: "required"
        },
        messages: {
            nome: "Por favor, insira seu nome",
            celular: "Por favor, insira seu telefone",
            email: {
                required: "Por favor, insira seu email",
                email: "Por favor, insira um email válido"
            },
            tipo: "Por favor, insira o tipo de mensagem",
            endereco: "Por favor, insira seu endereço",
            mensagem: "Por favor, insira sua mensagem"
        },
        errorPlacement(error, element) {
            error.appendTo(
                element.closest(".form-group")
                    .find(".msg-error")
                    .removeClass("hidden")
            );
        },
        highlight(el) {
            $(el).addClass('border-2 border-red-500');
        },
        unhighlight(el) {
            $(el).removeClass('border-2 border-red-500');
        },
        onfocusout(element) { $(element).valid(); },
        onkeyup(element) { $(element).valid(); },
        submitHandler(form) {
            // Mostra o backdrop
            backdrop.classList.remove('hidden');

            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;

            submitBtn.innerHTML = "⏳ Enviando...";
            submitBtn.disabled = true;
            submitBtn.classList.add('opacity-70', 'cursor-not-allowed');

            fetch(SCRIPT_URL, {
                method: "POST",
                mode: "no-cors",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nome: form.nome.value,
                    celular: form.celular.value,
                    email: form.email.value,
                    tipo: form.tipo.value,
                    endereco: form.endereco.value,
                    mensagem: form.mensagem.value,
                    destinatario: destinatario
                })
            })
                .then(() => {
                    msgSucesso.classList.remove('hidden');
                    msgErro.classList.add('hidden');
                    form.reset();
                    window.dispatchEvent(new Event('reset-form'));
                })
                .catch(() => {
                    msgErro.classList.remove('hidden');
                    msgSucesso.classList.add('hidden');
                })
                .finally(() => {
                    // Esconde o backdrop
                    backdrop.classList.add('hidden');
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                    setTimeout(() => {
                        msgSucesso.classList.add('hidden');
                        msgErro.classList.add('hidden');
                    }, 2000);
                    submitBtn.classList.remove('opacity-70', 'cursor-not-allowed');
                });
        }
    });
})();

/**
 * Inicializa o plugin intlTelInput nos campos de telefone.
 * 
 * Localiza elementos com `data-id="telefone"` e aplica a configuração do plugin.
 * Chama a função `configureIntlTelInput` para configurar os campos de telefone disponivel no script base.
 * 
 * @returns {void}
 */
(function initIntlTelInputs() {
    const telefones = document.querySelectorAll('[data-id="telefone"]');

    if (telefones.length > 0) {
        telefones.forEach((telefone) => {
            configureIntlTelInput(telefone, {
                useGeoIp: false,
                showFlags: true,
            });
        });
    }
})();

/**
 * Configura o input de telefone usando o plugin intl-tel-input.
 * 
 * Aplica formatação, validação e configurações específicas para campos telefônicos,
 * incluindo ajuste do label para ficar dentro do wrapper do plugin.
 * 
 * API para geoIpLookup:
 *  - "https://freegeoip.app/json/"
 *  - "https://ipapi.co/json"
 * 
 * @param {HTMLInputElement} input - Elemento input de telefone a ser configurado.
 * @returns {Object|undefined} Instância do intl-tel-input configurada, ou undefined em erro.
 * @throws {Error} Lança erro caso a configuração falhe.
 */
function configureIntlTelInput(input, options = {}) {
    if (!input) return;

    const { useGeoIp = false } = options;

    try {
        const iti = window.intlTelInput(input, {
            utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@19.5.3/build/js/utils.js",
            initialCountry: options.initialCountry ?? "br",
            separateDialCode: options.separateDialCode ?? true,
            formatOnDisplay: options.formatOnDisplay ?? true,
            autoPlaceholder: options.autoPlaceholder ?? "off",
            nationalMode: options.nationalMode ?? false,
            allowDropdown: options.allowDropdown ?? false,
            showFlags: options.showFlags ?? false,

            ...(useGeoIp && {
                geoIpLookup: (callback) => {
                    const tryFetch = (url, onError) => {
                        fetch(url)
                            .then((res) => res.json())
                            .then((data) => {
                                const code =
                                    data?.country_code ||
                                    data?.country ||
                                    data?.countryCode ||
                                    "br";
                                callback(code.toLowerCase());
                            })
                            .catch(onError);
                    };

                    tryFetch("https://freegeoip.app/json/", () =>
                        tryFetch("https://ipapi.co/json", () => callback("br"))
                    );
                },
            }),
        });

        // Reposiciona o label dentro do wrapper
        setTimeout(() => {
            const wrapper = input.closest(".iti");
            const label = document.querySelector(`label[for="${input.id}"]`);
            if (wrapper && label && !wrapper.contains(label)) {
                wrapper.appendChild(label);
            }
        }, 0);

        return iti;
    } catch (error) {
        console.error(`💥 Erro ao configurar telefone para: ${input.name || input.id}`, error);
    }
}
