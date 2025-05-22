<template>
  <ion-page>
    <ion-content fullscreen class="ion-padding bg-light text-dark">
      <div class="container mt-5">
        <div class="card shadow p-4 mx-auto" style="max-width: 500px;">
          <h2 class="text-center text-success mb-4">Iniciar Sessió</h2>

          <!-- Camp per introduir el correu electrònic -->
          <div class="mb-3">
            <label class="form-label">Correu Electrònic</label>
            <input
              v-model="formData.email"   <!-- Vincula el valor amb formData.email -->
              type="email"
              class="form-control"
              placeholder="exemple@correu.com"
              required
            />
            <!-- Mostra un missatge d'error si el correu no és vàlid -->
            <div class="text-danger small" v-if="errors.email">{{ errors.email }}</div>
          </div>

          <!-- Camp per introduir la contrasenya -->
          <div class="mb-3">
            <label class="form-label">Contrasenya</label>
            <input
              v-model="formData.password"  <!-- Vincula el valor amb formData.password -->
              type="password"
              class="form-control"
              placeholder="********"
              required
            />
            <!-- Mostra un missatge d'error si no hi ha contrasenya -->
            <div class="text-danger small" v-if="errors.password">{{ errors.password }}</div>
          </div>

          <!-- Botó per iniciar sessió -->
          <button class="btn btn-success w-100" @click="handleSubmit">
            Iniciar Sessió
          </button>

          <!-- Botó per reenviar el correu de verificació (només es mostra si és necessari) -->
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
import { ref } from 'vue';
import supabase from '@/supabaseClient';
import { useRouter } from 'vue-router';

// Obtenim el router per poder redirigir després de login
const router = useRouter();

// Dades del formulari (email i contrasenya)
const formData = ref({
  email: '',
  password: '',
});

// Missatges d'error per als camps
const errors = ref({
  email: '',
  password: '',
});

// Controla si s'ha de mostrar el botó per reenviar correu de verificació
const showResendEmail = ref(false);

// Funció per validar el formulari abans d'enviar
const validateForm = () => {
  errors.value = {
    email: formData.value.email && /\S+@\S+\.\S+/.test(formData.value.email)
      ? ''
      : 'Correo electrónico no válido.',  // Missatge si el correu és invàlid
    password: formData.value.password ? '' : 'La contraseña es obligatoria.', // Missatge si falta la contrasenya
  };

  // Retorna true només si tots els camps són vàlids
  return !Object.values(errors.value).some((e) => e !== '');
};

// Funció que gestiona l'inici de sessió
const handleSubmit = async () => {
  if (!validateForm()) return; // Si el formulari no és vàlid, s'atura

  try {
    // Cridem a Supabase per iniciar sessió amb correu i contrasenya
    const { data, error } = await supabase.auth.signInWithPassword({
      email: formData.value.email,
      password: formData.value.password,
    });

    if (error) {
      // Si l'error és que no s'ha confirmat el correu, avisem l'usuari
      if (error.message.includes('Email not confirmed')) {
        showResendEmail.value = true;
        alert('Debes confirmar tu correo electrónico. Revisa tu bandeja de entrada.');
      } else {
        alert('Error al iniciar sesión: ' + error.message); // Altres errors
      }
      return;
    }

    const user = data.user;

    // Si l'usuari no té el correu confirmat, no permetem continuar
    if (!user.email_confirmed_at) {
      showResendEmail.value = true;
      alert('Confirma tu correo electrónico para continuar.');
      return;
    }

    // Consultem la taula 'usuarios' per obtenir dades addicionals com si és admin
    const { data: userData, error: dbError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('user_id', user.id)
      .single();  // Busquem un sol resultat

    if (dbError) {
      console.error('Error en consulta de usuarios:', dbError);
      throw dbError;
    }

    // Redirigim l'usuari a la pàgina principal amb el seu ID i si és admin
    router.push({ 
      path: '/Principal', 
      query: { 
        userId: user.id, 
        isAdmin: userData.is_admin ? 'true' : 'false' 
      } 
    });

  } catch (err: any) {
    // Error inesperat
    alert('Error al iniciar sesión: ' + err.message);
  }
};

// Funció per reenviar el correu de verificació
const resendVerificationEmail = async () => {
  try {
    const { error } = await supabase.auth.resendVerificationEmail(formData.value.email);
    if (error) throw error;
    alert('Correo de verificación reenviado. Revisa tu correo.');
  } catch (err: any) {
    alert('Error al reenviar correo: ' + err.message);
  }
};
</script>
