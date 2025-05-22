<template>
  <ion-page>
    <ion-header translucent>
      <ion-toolbar color="dark">
        <ion-title class="text-success d-flex align-items-center gap-2">
          <ion-icon :icon="filmOutline"></ion-icon>
          <span>Butaca1</span>
        </ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content fullscreen class="ion-padding bg-light text-dark">
      <div class="container mt-5">
        <div class="card shadow p-4 mx-auto" style="max-width: 500px;">
          <h2 class="text-center text-success mb-4">Registre</h2>

          <!-- Nombre -->
          <div class="mb-3">
            <label class="form-label">Nom d'usuari</label>
            <input
              v-model="formData.name"
              type="text"
              class="form-control"
              placeholder="El teu nom"
              required
            />
            <div class="text-danger small" v-if="errors.name">{{ errors.name }}</div>
          </div>

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

          <!-- Confirmar Contraseña -->
          <div class="mb-4">
            <label class="form-label">Confirmar Contrasenya</label>
            <input
              v-model="formData.confirmPassword"
              type="password"
              class="form-control"
              placeholder="********"
              required
            />
            <div class="text-danger small" v-if="errors.confirmPassword">{{ errors.confirmPassword }}</div>
          </div>

          <!-- Botón -->
          <button class="btn btn-success w-100" @click="handleSubmit">
            Registrar-se
          </button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import {
  IonPage, IonHeader, IonToolbar, IonButtons, IonBackButton,
  IonTitle, IonContent, IonItem, IonLabel, IonInput, IonButton, IonTextarea
} from '@ionic/vue';

import supabase from '@/supabaseClient'; // Client Supabase per interactuar amb la BBDD

// Icones usades en el template
import { filmOutline, personOutline, starOutline } from 'ionicons/icons';

// Model del formulari (reactiu)
const formData = ref({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
});

// Missatges d’error per cada camp
const errors = ref({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
});

// Funció per validar que tots els camps siguin correctes
const validateForm = () => {
  errors.value = {
    name: formData.value.name ? '' : 'El nom és obligatori.',
    email: formData.value.email && /\S+@\S+\.\S+/.test(formData.value.email)
      ? '' : 'Correo electrònic no vàlid.',
    password: formData.value.password ? '' : 'La contrasenya és obligatoria.',
    confirmPassword: formData.value.confirmPassword === formData.value.password
      ? '' : 'Les contrasenyes no coincideixen.',
  };

  // Retorna true si no hi ha cap error
  return !Object.values(errors.value).some((e) => e !== '');
};

// Funció per gestionar el registre de l'usuari
const handleSubmit = async () => {
  if (!validateForm()) return; // No segueix si hi ha errors

  try {
    // Crea el compte d'usuari amb Supabase
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: formData.value.email,
      password: formData.value.password,
    });

    if (signUpError) throw signUpError;

    const user = signUpData?.user;

    if (!user) {
      alert('Registre creat, pero has de verificar el teu correu.');
      return;
    }

    // Desa informació addicional de l’usuari a la taula `usuarios`
    const { error: dbError } = await supabase.from('usuarios').insert([
      {
        user_id: user.id,
        name: formData.value.name,
        email: formData.value.email,
      },
    ]);

    if (dbError) throw dbError;

    alert('¡Registre exitós!');
  } catch (err: any) {
    alert('Error al registrar: ' + err.message);
  }
};
</script>

