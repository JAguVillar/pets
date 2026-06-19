<script setup>
import * as z from "zod";

definePageMeta({ auth: false, layout: false });

const supabase = useSupabaseClient();
const toast = useToast();
const router = useRouter();

const mode = ref("login");
const loading = ref(false);

const schema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

const state = reactive({ email: "", password: "" });

async function onSubmit({ data }) {
  loading.value = true;
  try {
    if (mode.value === "login") {
      const { error } = await supabase.auth.signInWithPassword(data);
      if (error) throw error;
      toast.add({ title: "Bienvenido", color: "success" });
      await router.push("/");
    } else {
      const { error } = await supabase.auth.signUp(data);
      if (error) throw error;
      toast.add({
        title: "Cuenta creada",
        description: "Revisá tu mail si pediste confirmación.",
        color: "success",
      });
      mode.value = "login";
    }
  } catch (e) {
    toast.add({ title: "Error", description: e.message, color: "error" });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <UCard class="w-full max-w-md">
      <template #header>
        <h1 class="text-lg font-semibold">
          {{ mode === "login" ? "Iniciar sesión" : "Crear cuenta" }}
        </h1>
      </template>

      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Email" name="email">
          <UInput v-model="state.email" type="email" class="w-full" />
        </UFormField>

        <UFormField label="Contraseña" name="password">
          <UInput v-model="state.password" type="password" class="w-full" />
        </UFormField>

        <UButton type="submit" block :loading="loading">
          {{ mode === "login" ? "Ingresar" : "Crear cuenta" }}
        </UButton>
      </UForm>

      <template #footer>
        <UButton
          variant="link"
          size="sm"
          :disabled="loading"
          @click="mode = mode === 'login' ? 'register' : 'login'"
        >
          {{ mode === "login" ? "Crear una cuenta" : "Ya tengo cuenta" }}
        </UButton>
      </template>
    </UCard>
  </div>
</template>
