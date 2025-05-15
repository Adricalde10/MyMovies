<template>
  <ion-page>
    <ion-content fullscreen class="ion-padding bg-light text-dark">
      <div class="container mt-5">
        <div class="card shadow p-4 mx-auto" style="max-width: 500px;">
          <h2 class="text-center text-success mb-4">Inicia Sesión</h2>

          <!-- Correo -->
          <div class="mb-3">
            <label class="form-label">Correo Electrónico</label>
            <input
              v-model="formData.email"
              type="email"
              class="form-control"
              placeholder="ejemplo@correo.com"
              required
            />
            <div class="text-danger small" v-if="errors.email">{{ errors.email }}</div>
          </div>

          <!-- Contraseña -->
          <div class="mb-3">
            <label class="form-label">Contraseña</label>
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
            Iniciar Sesión
          </button>

          <!-- Reenvío de correo de verificación -->
          <div v-if="showResendEmail" class="mt-3">
            <button class="btn btn-secondary w-100" @click="resendVerificationEmail">
              Reenviar Correo de Verificación
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

const router = useRouter();

const formData = ref({
  email: '',
  password: '',
});

const errors = ref({
  email: '',
  password: '',
});

const showResendEmail = ref(false);

const validateForm = () => {
  errors.value = {
    email: formData.value.email && /\S+@\S+\.\S+/.test(formData.value.email)
      ? ''
      : 'Correo electrónico no válido.',
    password: formData.value.password ? '' : 'La contraseña es obligatoria.',
  };

  return !Object.values(errors.value).some((e) => e !== '');
};

const handleSubmit = async () => {
  if (!validateForm()) return;

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: formData.value.email,
      password: formData.value.password,
    });

    if (error) {
      if (error.message.includes('Email not confirmed')) {
        showResendEmail.value = true;
        alert('Debes confirmar tu correo electrónico. Revisa tu bandeja de entrada.');
      } else {
        alert('Error al iniciar sesión: ' + error.message);
      }
      return;
    }

    const user = data.user;

    if (!user.email_confirmed_at) {
      showResendEmail.value = true;
      alert('Confirma tu correo electrónico para continuar.');
      return;
    }

    // Consultar usuario en la tabla 'usuarios'
    const { data: userData, error: dbError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (dbError) {
      console.error('Error en consulta de usuarios:', dbError);
      throw dbError;
    }

    // Redirigir al usuario a la página principal y pasar si es admin
    router.push({ 
      path: '/Principal', 
      query: { 
        userId: user.id, 
        isAdmin: userData.is_admin ? 'true' : 'false' 
      } 
    });
    

  } catch (err: any) {
    alert('Error al iniciar sesión: ' + err.message);
  }
};

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
