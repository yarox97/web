<template>
  <div class="register-view">
    <h1>New to <span style="color: var(--blue);">
      <i>VolleyMS</i>
    </span>?</h1>

    <form @submit.prevent="handleSubmit">
      
      <div class="field">
        <input 
          type="text" 
          id="username"
          v-model="userName" 
          required 
          pattern="[A-Za-z0-9]{3,}"
          placeholder=" "
        />
        <label for="username">Username</label>

        <span v-if="checkingLogin" class="info">Checking...</span>
        <span v-if="isLoginAvailable === true" class="success">Login is free</span>
        <span v-if="isLoginAvailable === false" class="error-text">Login is taken</span>
      </div>

      <div class="field">
        <input 
          type="text" 
          id="name"
          v-model="name" 
          required 
          pattern="[A-Za-zА-Яа-я]{2,}"
          placeholder=" "
        />
        <label for="name">Name</label>
      </div>

      <div class="field">
        <input 
          type="text" 
          id="surname"
          v-model="surname" 
          required 
          pattern="[A-Za-zА-Яа-я]{2,}"
          placeholder=" "
        />
        <label for="surname">Surname</label>
      </div>

      <div class="field">
        <input 
          type="email" 
          id="email"
          v-model="email" 
          required 
          placeholder=" "
        />
        <label for="email">Email</label>

        <span v-if="checkingEmail" class="info">Checking...</span>
        <span v-if="isEmailAvailable === true" class="success">Email is free</span>
        <span v-if="isEmailAvailable === false" class="error-text">Email is taken</span>
      </div>

      <div class="field">
        <input 
          type="password" 
          id="password"
          v-model="password" 
          required 
          placeholder=" "
          minlength="5"
        />
        <label for="password">Password</label>
      </div>

      <div class="field">
        <input 
          type="password" 
          id="rep-password"
          v-model="repeatedPassword" 
          required 
          placeholder=" "
        />
        <label for="rep-password">Repeat password</label>
      </div>

      <span v-if="passwordDoesNotMatch" class="error-text main-error">
        Passwords do not match
      </span>

      <div v-if="error" class="error-box">{{ error }}</div>

      <button
        type="submit"
        :disabled="isLoginAvailable === false || isEmailAvailable === false || passwordDoesNotMatch || submitting"
      >
        {{ submitting ? "Registering..." : "Register" }}
      </button>

      <span class="link">
        Have an account?
        <router-link to="/login">Login</router-link>
      </span>
    </form>
  </div>
</template>

<style scoped>
.register-view {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  max-width: 550px;
  min-width: 400px;
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
  margin-bottom: 20px; 
  display: flex;
  flex-direction: column; 
}

input {
  width: 100%;
  height: 50px;
  padding: 20px 10px 6px; 
  border-radius: 6px;
  border: 1px solid #ccc;
  font-size: 14px;
  background: transparent;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

input:focus {
  border-color: var(--blue, #3a86c0);
}

label {
  position: absolute;
  left: 10px;
  top: 25px; 
  transform: translateY(-50%);
  font-size: 14px;
  color: #6b7280;
  pointer-events: none;
  transition: all 0.2s ease;
  background: transparent;
  padding: 0;
}

input:focus ~ label,
input:not(:placeholder-shown) ~ label {
  top: 8px;
  transform: translateY(0);
  font-size: 11px;
  color: var(--blue, #3a86c0);
  font-weight: 600;
}

button {
  width: 100%;
  padding: 12px;
  margin-top: 15px;
  border: none;
  border-radius: 8px;
  background-color: var(--blue, #007bff);
  color: white;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

button:hover {
  background-color: #3a86c0;
}

button:disabled {
  background-color: #a5a5a5;
  cursor: not-allowed;
}

.success, .error-text, .info {
  font-size: 12px;
  margin-top: 4px;
  margin-left: 2px;
  display: block;
}

.success { color: #16a34a; }
.error-text { color: #dc2626; }
.info { color: #6b7280; }

.main-error {
  width: 100%;
  text-align: center;
  margin-bottom: 5px;
}

.error-box {
  width: 100%;
  margin-top: 10px;
  padding: 12px;
  background-color: #fee2e2;
  border: 1px solid #fca5a5;
  border-radius: 8px;
  color: #991b1b;
}

.link {
  margin-top: 15px;
}

.link a {
  color: var(--blue, #007bff);
  text-decoration: none;
}
</style>

<script>
import axios from "axios";
import debounce from "lodash/debounce";

export default {
  name: "RegisterView",
  data() {
    return {
      userName: "",
      name: "",
      surname: "",
      email: "",
      password: "",
      repeatedPassword: "",
      isLoginAvailable: null,
      isEmailAvailable: null,
      passwordDoesNotMatch: false,
      checkingLogin: false,
      checkingEmail: false,
      submitting: false,
      error: ""
    };
  },

  created() {
    this.checkLoginDebounced = debounce(this.checkLogin, 500);
    this.checkEmailDebounced = debounce(this.checkEmail, 500);
  },

  watch: {
    userName(value) {
      this.checkLoginDebounced(value);
    },
    email(value) {
      this.checkEmailDebounced(value);
    },
    password() {
      this.checkPasswords();
    },
    repeatedPassword() {
      this.checkPasswords();
    }
  },

  methods: {
    async checkLogin(value) {
      if (value.length < 3) {
        this.isLoginAvailable = null;
        return;
      }

      this.checkingLogin = true;
      try {
        const response = await axios.get(
          "https://localhost:7207/api/auth/login-check",
          { params: { userName: value } }
        );
        this.isLoginAvailable = response.data;
      } catch {
        this.isLoginAvailable = null;
      } finally {
        this.checkingLogin = false;
      }
    },

    async checkEmail(value) {
      if (value.length < 3) {
        this.isEmailAvailable = null;
        return;
      }

      this.checkingEmail = false; 
      this.checkingEmail = true; 
      try {
        const response = await axios.get(
          "https://localhost:7207/api/auth/email-check",
          { params: { email: value } }
        );
        this.isEmailAvailable = !response.data;
      } catch {
        this.isEmailAvailable = null;
      } finally {
        this.checkingEmail = false;
      }
    },

    checkPasswords() {
      this.passwordDoesNotMatch =
        this.password && this.repeatedPassword && this.password !== this.repeatedPassword;
    },

    async register() {
      this.submitting = true;
      this.error = "";
      try {
        const payload = {
          userName: this.userName,
          password: this.password,
          name: this.name,
          surname: this.surname,
          email: this.email
        };

        await axios.post(
          "https://localhost:7207/api/auth/register",
          payload
        );

        this.$router.push("/login");
      } catch (error) {
        this.error =
          error.response?.data?.message ||
          "An error occurred during registration.";
      } finally {
        this.submitting = false;
      }
    },

    async handleSubmit() {
      if (
        this.passwordDoesNotMatch ||
        this.isLoginAvailable === false ||
        this.isEmailAvailable === false
      ) {
        return;
      }
      await this.register();
    }
  }
};
</script>