<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { personOutline } from 'ionicons/icons';
import { useRouter } from 'vue-router';
import supabase from '@/supabaseClient';
// Usuario desde query
import { useRoute } from 'vue-router';
const route = useRoute();
const userId = route.query.userId;
alert(userId);
const router = useRouter();

// Datos usuario
const userName = ref('');
const userEmail = ref('');
const newPassword = ref('');
const loading = ref(true);
const errorMessage = ref('');



// Función para cargar datos de usuario desde Supabase
const loadUserData = async () => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;

    if (data) {
      userName.value = data.name || '';
      userEmail.value = data.email || '';
    } else {
      errorMessage.value = 'No se encontró información del usuario.';
    }
  } catch (error: any) {
    errorMessage.value = 'Error al cargar datos del usuario: ' + error.message;
  } finally {
    loading.value = false;
  }
};

onMounted(loadUserData);

// Función para guardar cambios (actualizar usuario)
const saveChanges = async () => {
  loading.value = true;
  errorMessage.value = '';

  try {
    const updates: any = {
      name: userName.value,
      email: userEmail.value,
    };
    if (newPassword.value) {
      updates.password = newPassword.value; // Ajusta según tu esquema de contraseñas
    }

    const { error } = await supabase
      .from('usuarios')
      .update(updates)
      .eq('id', userId);

    if (error) throw error;

    alert('Canvis guardats!');
    newPassword.value = ''; // Limpiar campo contraseña
  } catch (error: any) {
    alert('Error al guardar: ' + error.message);
  } finally {
    loading.value = false;
  }
};

function changeProfilePicture() {
  alert("Funció per canviar la foto de perfil.");
}

function deleteAccount() {
  alert("Compte eliminat.");
}

function logout() {
  alert("Sessió tancada.");
  router.push('/Principal');  // Redirigir al login
}

function closeInfoUser() {
  router.push('/');
}
</script>

<template>
  <ion-page>
    <ion-content fullscreen class="ion-padding bg-gray-100 text-gray-900">
      <div class="overlay"></div>

      <div class="info-user-container position-relative">
        <button class="close-button" @click="closeInfoUser">✕</button>

        <div class="profile-picture-container">
          <ion-icon :icon="personOutline" class="profile-picture"></ion-icon>
          <ion-button expand="block" @click="changeProfilePicture">Canviar foto</ion-button>
        </div>

        <div v-if="loading" class="ion-text-center">
          <ion-spinner name="crescent" />
        </div>

        <div v-else>
          <ion-item>
            <ion-label position="stacked">Nom d'usuari</ion-label>
            <ion-input v-model="userName" placeholder="Nom d'usuari" />
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Correu electrònic</ion-label>
            <ion-input v-model="userEmail" placeholder="Correu electrònic" />
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Nova contrasenya</ion-label>
            <ion-input
              v-model="newPassword"
              placeholder="Nova contrasenya"
              type="password"
            />
          </ion-item>

          <ion-button expand="block" class="mt-4" href="/infoFavourites">
            Veure continguts favorits
          </ion-button>
          <ion-button expand="block" class="mt-4" @click="saveChanges" :disabled="loading">
            Guardar canvis
          </ion-button>
          <ion-button expand="block" color="danger" class="mt-2" @click="deleteAccount">
            Eliminar compte
          </ion-button>
          <ion-button expand="block" color="medium" class="mt-2" @click="logout">
            Tancar sessió
          </ion-button>

          <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

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

.error-message {
  color: red;
  margin-top: 10px;
  text-align: center;
}
</style>
