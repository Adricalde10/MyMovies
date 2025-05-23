<template>
  <ion-page>
    <ion-content fullscreen class="ion-padding bg-light text-dark">
      <div class="container mt-5">
        <div class="card shadow p-4 mx-auto" style="max-width: 500px;">
          <h2 class="text-center text-success mb-4">Iniciar Sessió</h2>

          <!-- Correo -->
          <div class="mb-3">
            <label class="form-label">Correu Electrònic</label>
            <input
              v-model="formData.email"
              type="email"
              class="form-control"
              placeholder="exemple@correu.com"
              required
            />
            <div class="text-danger small" v-if="errors.email">{{ errors.email }}</div>
          </div>

          <!-- Contraseña -->
          <div class="mb-3">
            <label class="form-label">Contrasenya</label>
            <input
              v-model="formData.password"
              type="password"
              class="form-control"
              placeholder="********"
              required
            />
            <div class="text-danger small" v-if="errors.password">{{ errors.password }}</div>
          </div>

          <!-- Botón -->
          <button class="btn btn-success w-100" @click="handleSubmit">
            Iniciar Sessió
          </button>

          <!-- Reenvío de correo de verificación -->
          <div v-if="showResendEmail" class="mt-3">
            <button class="btn btn-secondary w-100" @click="resendVerificationEmail">
              Reenviar Correu de Verificació
            </button>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
// Importem les utilitats necessàries de Vue i Supabase
import { ref } from 'vue';
import supabase from '@/supabaseClient';
import { useRouter } from 'vue-router';

// Inicialitzem el router per redirigir usuaris
const router = useRouter();

// Dades del formulari de login (email i contrasenya)
const formData = ref({
  email: '',
  password: '',
});

// Missatges d'error per cada camp del formulari
const errors = ref({
  email: '',
  password: '',
});

// Mostra o no l'opció de reenviar el correu de verificació
const showResendEmail = ref(false);

// Funció per validar el formulari abans d'enviar
const validateForm = () => {
  // Comprova format de l'email i que la contrasenya no sigui buida
  errors.value = {
    email: formData.value.email && /\S+@\S+\.\S+/.test(formData.value.email)
      ? ''
      : 'Correo electrónico no válido.',
    password: formData.value.password ? '' : 'La contraseña es obligatoria.',
  };

  // Retorna true si no hi ha cap error
  return !Object.values(errors.value).some((e) => e !== '');
};

// Funció per gestionar l'enviament del formulari
const handleSubmit = async () => {
  if (!validateForm()) return; // Si el formulari no és vàlid, no continua

  try {
    // Intenta iniciar sessió amb email i contrasenya
    const { data, error } = await supabase.auth.signInWithPassword({
      email: formData.value.email,
      password: formData.value.password,
    });

    // Si hi ha error d'autenticació
    if (error) {
      if (error.message.includes('Email not confirmed')) {
        // Si l'email no està confirmat, mostra missatge i opció de reenviar
        showResendEmail.value = true;
        alert('Debes confirmar tu correo electrónico. Revisa tu bandeja de entrada.');
      } else {
        alert('Error al iniciar sesión: ' + error.message);
      }
      return;
    }

    const user = data.user;

    // Si l'usuari ha iniciat sessió però no ha confirmat el correu
    if (!user.email_confirmed_at) {
      showResendEmail.value = true;
      alert('Confirma tu correo electrónico para continuar.');
      return;
    }

    // Consultar les dades de l'usuari a la taula 'usuarios'
    const { data: userData, error: dbError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Si hi ha error a la consulta a la base de dades
    if (dbError) {
      console.error('Error en consulta de usuarios:', dbError);
      throw dbError;
    }

    // Redirigeix l'usuari a la pàgina principal, afegint userId i si és admin
    router.push({ 
      path: '/Principal', 
      query: { 
        userId: user.id, 
        isAdmin: userData.is_admin ? 'true' : 'false' 
      } 
    });

  } catch (err: any) {
    // En cas d'error inesperat
    alert('Error al iniciar sesión: ' + err.message);
  }
};

// Funció per reenviar el correu de verificació
const resendVerificationEmail = async () => {
  try {
    // Supabase permet reenviar el correu de verificació
    const { error } = await supabase.auth.resendVerificationEmail(formData.value.email);
    if (error) throw error;
    alert('Correo de verificación reenviado. Revisa tu correo.');
  } catch (err: any) {
    alert('Error al reenviar correo: ' + err.message);
  }
};
</script>
