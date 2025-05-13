<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Registro</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-item>
        <ion-label position="floating">Nombre de Usuario</ion-label>
        <ion-input v-model="name" type="text" required></ion-input>
      </ion-item>

      <ion-item>
        <ion-label position="floating">Correo Electrónico</ion-label>
        <ion-input v-model="email" type="email" required></ion-input>
      </ion-item>

      <ion-item>
        <ion-label position="floating">Contraseña</ion-label>
        <ion-input v-model="password" type="password" required></ion-input>
      </ion-item>

      <ion-item>
        <ion-label position="floating">Confirmar Contraseña</ion-label>
        <ion-input v-model="confirmPassword" type="password" required></ion-input>
      </ion-item>

      <ion-button expand="full" @click="register">Registrar</ion-button>
    </ion-content>
  </ion-page>
</template>
<script>
import supabase from '@/supabaseClient';

export default {
  data() {
    return {
      name: this.name,
      email: this.email,
      password: this.password,
      confirmPassword: this.confirmPassword,
    };
  },
  methods: {
    async register() {
      if (!this.name || !this.email || !this.password || !this.confirmPassword) {
        alert('Por favor, completa todos los campos.');
        return;
      }

      if (this.password !== this.confirmPassword) {
        alert('Las contraseñas no coinciden.');
        return;
      }

      try {
        // Crear usuario en Supabase Auth
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: this.email,
          password: this.password,
        });

        if (signUpError) throw signUpError;

        // ⚠️ IMPORTANTE: accedemos a signUpData.user para evitar errores de shadowing
        const user = signUpData.user;

        if (!user) {
          alert("Registro creado, pero se requiere verificar el correo antes de continuar.");
          return;
        }

        // Insertar datos adicionales en la tabla 'usuarios'
        const { error: dbError } = await supabase
          .from('usuarios')
          .insert([
            {
              user_id: user.id,
              name: this.name,
              email: this.email,
            },
          ]);

        if (dbError) throw dbError;

        alert('Registro exitoso');
        this.$router.push('/login');

      } catch (err) {
        console.error('Error en el registro:', err.message);
        alert('Error al registrar: ' + err.message);
      }
    },
  },
};
</script>
