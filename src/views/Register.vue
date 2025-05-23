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
// Importem ref de Vue per a dades reactives
import { ref } from 'vue';
// Importem components d'Ionic per la UI del formulari
import { IonPage, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonContent, IonItem, IonLabel, IonInput, IonButton, IonTextarea } from '@ionic/vue';
// Importem supabase per fer peticions a la base de dades i autenticació
import supabase from '@/supabaseClient';
// Importem icones (tot i que no s'utilitzen aquí directament)
import { filmOutline, personOutline, starOutline } from 'ionicons/icons';

// Objecte reactiu per guardar les dades del formulari
const formData = ref({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
});

// Objecte reactiu per guardar els errors de validació per cada camp
const errors = ref({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
});

// Funció que valida el formulari i actualitza els errors
const validateForm = () => {
  errors.value = {
    // Nom ha d'estar omplert
    name: formData.value.name ? '' : 'El nom és obligatori.',
    // Email ha de tenir format vàlid
    email: formData.value.email && /\S+@\S+\.\S+/.test(formData.value.email) ? '' : 'Correo electrònic no vàlid.',
    // Password obligatori
    password: formData.value.password ? '' : 'La contrasenya és obligatoria.',
    // Confirmar password ha de coincidir amb password
    confirmPassword:
      formData.value.confirmPassword === formData.value.password
        ? ''
        : 'Les contrasenyes no coincideixen.',
  };

  // Retorna true si no hi ha errors (tots els valors són cadenes buides)
  return !Object.values(errors.value).some((e) => e !== '');
};

// Funció que gestiona l'enviament del formulari per registrar un usuari nou
const handleSubmit = async () => {
  // Validem el formulari i si no és vàlid, parem aquí
  if (!validateForm()) return;

  try {
    // Intentem registrar l'usuari amb Supabase Authentication
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: formData.value.email,
      password: formData.value.password,
    });

    // Si hi ha error, el llença per capturar-lo més endavant
    if (signUpError) throw signUpError;

    // Obtenim l'usuari creat
    const user = signUpData?.user;

    // Si no hi ha usuari (ex: registre pendent confirmació), avisa a l'usuari
    if (!user) {
      alert('Registre creat, pero has de verificar el teu correu.');
      return;
    }

    // Inserim l'usuari a la taula 'usuarios' amb dades addicionals (nom i email)
    const { error: dbError } = await supabase.from('usuarios').insert([
      {
        user_id: user.id,
        name: formData.value.name,
        email: formData.value.email,
      },
    ]);

    // Si hi ha error a la base de dades, el llença per capturar-lo més endavant
    if (dbError) throw dbError;

    // Confirmació d'èxit al registrar l'usuari
    alert('¡Registre exitós!');
  } catch (err: any) {
    // En cas d'error, mostrar un missatge amb el detall de l'error
    alert('Error al registrar: ' + err.message);
  }
};
</script>

