<template>
  <div class="login-view">
    <h1>Welcome back to <span style="color: var(--blue);">
      <i>VolleyMS</i>
    </span></h1>

    <form @submit.prevent="handleSubmit">
      <div class="field">
        <label>Username</label>
        <input
          type="text"
          v-model="userName"
          required
          pattern="[A-Za-z0-9]{3,}"
        />
      </div>

      <div class="field">
        <label>Password</label>
        <input
          type="password"
          v-model="password"
          required
        />
      </div>

      <div v-if="error" class="error-box">
        {{ error }}
      </div>

      <button type="submit">
        Login
      </button>

      <span class="link">
        Don't have an account?
        <router-link to="/register">Register</router-link>
      </span>
    </form>
  </div>
</template>

<style scoped>
.login-view {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  max-width: 450px;
  margin: 100px auto;
  padding: 30px;
  border-radius: 12px;
  background-color: #f9f9f9;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

h1 {
  text-align: center;
  margin-bottom: 25px;
}

form {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.field {
  width: 100%;
  position: relative;
  margin-bottom: 18px;
}

label {
  position: absolute;
  top: 6px;
  left: 10px;
  font-size: 12px;
  color: #6b7280;
  background: #f9f9f9;
  padding: 0 4px;
  pointer-events: none;
}

input {
  width: 100%;
  padding: 18px 10px 8px;
  border-radius: 6px;
  border: 1px solid #ccc;
  font-size: 14px;
}

button {
  width: 100%;
  padding: 12px;
  margin-top: 10px;
  border: none;
  border-radius: 8px;
  background-color: var(--blue);
  color: white;
  font-size: 16px;
  cursor: pointer;
}

button:hover {
  background-color: #3a86c0;
}

.error-box {
  width: 100%;
  margin-top: 10px;
  padding: 12px;
  background-color: #fee2e2;
  border: 1px solid #fca5a5;
  border-radius: 8px;
  color: #991b1b;
  font-size: 14px;
}

.link {
  margin-top: 15px;
}

.link a {
  color: var(--blue);
  text-decoration: none;
}
</style>

<script>
import axios from "axios";
import { useAuthStore } from "@/stores/authStore";
export default {
  name: "LoginView",

  setup() {
    const authStore = useAuthStore();
    return { authStore };
  },

  data() {
    return {
      userName: "",
      password: "",
      error: ""
    };
  },

  methods: {
    async login() {
  this.error = "";
  try {
    const payload = {
      userName: this.userName,
      password: this.password
    };

    await axios.post(
      "https://localhost:7207/api/auth/login",
      payload,
      { withCredentials: true } 
    );

    // start of the session
    await this.authStore.loginSuccess();

    this.$router.push("app/cockpit"); 
  } catch (error) {
    console.error(error);
    this.error =
      error.response?.data?.message ||
      "An error occurred during login.";
  }
},

    async handleSubmit() {
      await this.login();
    }
  }
};
</script>
