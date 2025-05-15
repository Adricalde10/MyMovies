<template>
  <ion-page>
    <ion-content fullscreen class="ion-padding bg-gray-100 text-gray-900">
      <!-- Pantalla superposada amb fons difuminat -->
      <div class="overlay"></div>

      <div class="info-user-container position-relative">
        <!-- Botó de tancar (X) -->
        <button class="close-button" @click="closeInfoUser">✕</button>

        <!-- Foto de perfil -->
        <div class="profile-picture-container">
          <ion-icon :icon="personOutline" class="profile-picture"></ion-icon>
          <ion-button expand="block" @click="changeProfilePicture">Canviar foto</ion-button>
        </div>

        <!-- Informació de l'usuari -->
        <ion-item>
          <ion-label position="stacked">Nom d'usuari</ion-label>
          <ion-input v-model="userName" placeholder="Nom d'usuari"></ion-input>
        </ion-item>

        <ion-item>
          <ion-label position="stacked">Correu electrònic</ion-label>
          <ion-input v-model="userEmail" placeholder="Correu electrònic"></ion-input>
        </ion-item>

        <ion-item>
          <ion-label position="stacked">Nova contrasenya</ion-label>
          <ion-input v-model="newPassword" placeholder="Nova contrasenya" type="password"></ion-input>
        </ion-item>

        <!-- Botó per veure continguts favorits -->
        <ion-button expand="block" class="mt-4" href="/infoFavourites">Veure continguts favorits</ion-button>

        <!-- Botons per guardar canvis, eliminar compte i logout -->
        <ion-button expand="block" class="mt-4" @click="saveChanges">Guardar canvis</ion-button>
        <ion-button expand="block" color="danger" class="mt-2" @click="deleteAccount">Eliminar compte</ion-button>
        <ion-button expand="block" color="medium" class="mt-2" @click="logout">Tancar sessió</ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { personOutline } from 'ionicons/icons';
import { useRouter } from 'vue-router';

const userName = ref('');
const userEmail = ref('');
const newPassword = ref('');

const router = useRouter();

function changeProfilePicture() {
  alert("Funció per canviar la foto de perfil.");
}

function saveChanges() {
  alert("Canvis guardats!");
}

function deleteAccount() {
  alert("Compte eliminat.");
}

function logout() {
  alert("Sessió tancada.");
  router.push('/login'); // Canvia a la ruta adequada del teu projecte
}

function closeInfoUser() {
  router.push('/');
}
</script>

<style scoped>
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  backdrop-filter: blur(5px);
  background: rgba(0, 0, 0, 0.4);
  z-index: 1;
}

.info-user-container {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
  padding: 24px;
  background-color: white;
  border-radius: 12px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.close-button {
  position: absolute;
  top: 12px;
  right: 12px;
  font-size: 20px;
  border: none;
  background: transparent;
  color: #555;
  cursor: pointer;
  transition: color 0.2s;
}
.close-button:hover {
  color: #000;
}

.profile-picture-container {
  text-align: center;
}

.profile-picture {
  font-size: 100px;
  margin-bottom: 20px;
}
</style>
