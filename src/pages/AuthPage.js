import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { User, Mail, Lock, Shield, Users } from 'lucide-react';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [selectedRole, setSelectedRole] = useState('STAFF');
  
  const { login, register } = useAuth();
  
  const [formData, setFormData] = useState({
    nome: '',
    cognome: '',
    email: '',
    password: '',
    passwordRuolo: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email è richiesta';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email non valida';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password è richiesta';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password deve avere almeno 6 caratteri';
    }
    
    if (!isLogin) {
      if (!formData.nome) {
        newErrors.nome = 'Nome è richiesto';
      }
      if (!formData.cognome) {
        newErrors.cognome = 'Cognome è richiesto';
      }
      if (!formData.passwordRuolo) {
        newErrors.passwordRuolo = 'Password ruolo è richiesta';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      let result;
      
      if (isLogin) {
        result = await login(formData.email, formData.password);
      } else {
        result = await register({
          ...formData,
          ruolo: selectedRole
        });
      }
      
      if (!result.success) {
        setErrors({ general: result.message });
      }
    } catch (error) {
      setErrors({ general: 'Errore di connessione' });
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setErrors({});
    setFormData({
      nome: '',
      cognome: '',
      email: '',
      password: '',
      passwordRuolo: ''
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-8">
          <motion.div
            className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Shield className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-gradient">PADUS</h1>
          <p className="text-gray-600 mt-2">Gestione Prenotazioni</p>
        </div>

        <motion.div className="card" layout transition={{ duration: 0.3 }}>
          <div className="card-header">
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  isLogin 
                    ? 'bg-white text-primary-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Accedi
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  !isLogin 
                    ? 'bg-white text-primary-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Registrati
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="card-body space-y-4">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Nome"
                      name="nome"
                      value={formData.nome}
                      onChange={handleInputChange}
                      error={errors.nome}
                      icon={<User className="w-4 h-4" />}
                      placeholder="Mario"
                    />
                    <Input
                      label="Cognome"
                      name="cognome"
                      value={formData.cognome}
                      onChange={handleInputChange}
                      error={errors.cognome}
                      icon={<User className="w-4 h-4" />}
                      placeholder="Rossi"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Seleziona il tuo ruolo
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <motion.button
                        type="button"
                        onClick={() => setSelectedRole('STAFF')}
                        className={`p-4 rounded-xl border-2 transition-colors ${
                          selectedRole === 'STAFF'
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Users className="w-6 h-6 mx-auto mb-2" />
                        <div className="text-sm font-medium">Staff</div>
                        <div className="text-xs text-gray-500">Operativo</div>
                      </motion.button>
                      
                      <motion.button
                        type="button"
                        onClick={() => setSelectedRole('ADMIN')}
                        className={`p-4 rounded-xl border-2 transition-colors ${
                          selectedRole === 'ADMIN'
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Shield className="w-6 h-6 mx-auto mb-2" />
                        <div className="text-sm font-medium">Admin</div>
                        <div className="text-xs text-gray-500">Gestionale</div>
                      </motion.button>
                    </div>
                  </div>

                  <Input
                    label={`Password ${selectedRole === 'STAFF' ? 'Staff' : 'Admin'}`}
                    name="passwordRuolo"
                    type="password"
                    value={formData.passwordRuolo}
                    onChange={handleInputChange}
                    error={errors.passwordRuolo}
                    icon={<Shield className="w-4 h-4" />}
                    placeholder={selectedRole === 'STAFF' ? 'STAFF' : 'ADMIN'}
                    helperText={`Inserisci "${selectedRole}" per confermare il ruolo`}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <Input
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              error={errors.email}
              icon={<Mail className="w-4 h-4" />}
              placeholder="mario@esempio.com"
            />

            <Input
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              error={errors.password}
              icon={<Lock className="w-4 h-4" />}
              placeholder="••••••••"
            />

            {errors.general && (
              <motion.div
                className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                {errors.general}
              </motion.div>
            )}

            <Button
              type="submit"
              loading={loading}
              className="w-full"
              size="lg"
            >
              {isLogin ? 'Accedi' : 'Registrati'}
            </Button>
          </form>

          <div className="card-footer text-center">
            <p className="text-sm text-gray-600">
              {isLogin ? 'Non hai un account?' : 'Hai già un account?'}{' '}
              <button
                onClick={toggleMode}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                {isLogin ? 'Registrati' : 'Accedi'}
              </button>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AuthPage; 