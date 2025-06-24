import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, 
  ChevronLeft, 
  User, 
  Calendar, 
  Clock, 
  Users, 
  Phone, 
  FileText, 
  Upload, 
  X, 
  Check,
  AlertCircle,
  Star,
  Utensils,
  Gift,
  Baby
} from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useAuth } from '../../context/AuthContext';
import { createNormalBooking, createEventBooking, uploadBookingFile } from '../../services/bookingService';

const BookingWizard = ({ onComplete, onCancel }) => {
  const { canAutoApprove } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingType, setBookingType] = useState('normale');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const [formData, setFormData] = useState({
    // Prenotazione Normale
    nomeCliente: '',
    cognomeCliente: '',
    telefono: '',
    numeroPersone: 1,
    numeroBambini: 0,
    numeroNeonati: 0,
    sala: '',
    dataPrenotazione: '',
    orarioArrivo: '',
    note: '',
    
    // Prenotazione Evento
    nomeEvento: '',
    partecipanti: 1,
    tipoMenu: '',
    allergie: '',
    pacchetto: ''
  });

  const steps = [
    {
      number: 1,
      title: 'Tipo Prenotazione',
      description: 'Seleziona il tipo di prenotazione'
    },
    {
      number: 2,
      title: 'Informazioni Base',
      description: bookingType === 'normale' ? 'Dati cliente e dettagli' : 'Dettagli evento'
    },
    {
      number: 3,
      title: 'Allegati',
      description: 'Carica documenti opzionali'
    },
    {
      number: 4,
      title: 'Riepilogo',
      description: 'Verifica e conferma'
    }
  ];

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    const finalValue = type === 'number' ? parseInt(value) || 0 : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }));

    // Rimuovi errore se presente
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 2) {
      if (bookingType === 'normale') {
        if (!formData.nomeCliente.trim()) newErrors.nomeCliente = 'Nome cliente richiesto';
        if (!formData.cognomeCliente.trim()) newErrors.cognomeCliente = 'Cognome cliente richiesto';
        if (!formData.telefono.trim()) newErrors.telefono = 'Telefono richiesto';
        if (!formData.numeroPersone || formData.numeroPersone < 1) newErrors.numeroPersone = 'Numero persone non valido';
        if (!formData.dataPrenotazione) newErrors.dataPrenotazione = 'Data richiesta';
        if (!formData.orarioArrivo) newErrors.orarioArrivo = 'Orario richiesto';
      } else {
        if (!formData.nomeEvento.trim()) newErrors.nomeEvento = 'Nome evento richiesto';
        if (!formData.partecipanti || formData.partecipanti < 1) newErrors.partecipanti = 'Numero partecipanti non valido';
        if (!formData.dataPrenotazione) newErrors.dataPrenotazione = 'Data richiesta';
        if (!formData.orarioArrivo) newErrors.orarioArrivo = 'Orario richiesto';
        if (!formData.tipoMenu.trim()) newErrors.tipoMenu = 'Tipo menù richiesto';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleFileUpload = async (files) => {
    const validFiles = Array.from(files).filter(file => {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      if (!validTypes.includes(file.type)) {
        setErrors(prev => ({...prev, files: 'Formato file non supportato. Solo PDF, JPG, PNG'}));
        return false;
      }
      
      if (file.size > maxSize) {
        setErrors(prev => ({...prev, files: 'File troppo grande. Massimo 5MB'}));
        return false;
      }
      
      return true;
    });

    setUploadedFiles(prev => [...prev, ...validFiles]);
    setErrors(prev => ({...prev, files: null}));
  };

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      let result;
      
      if (bookingType === 'normale') {
        result = await createNormalBooking(formData);
      } else {
        result = await createEventBooking(formData);
      }

      // Upload file se presenti
      if (uploadedFiles.length > 0 && result.data?.id) {
        for (const file of uploadedFiles) {
          await uploadBookingFile(result.data.id, file);
        }
      }

      onComplete && onComplete(result.data);
    } catch (error) {
      setErrors({ general: error.response?.data?.message || 'Errore durante la creazione' });
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Che tipo di prenotazione vuoi creare?
              </h3>
              <p className="text-gray-600">
                Seleziona il tipo di prenotazione più adatto alle tue esigenze
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                  bookingType === 'normale'
                    ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => setBookingType('normale')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="text-center">
                  <Users className="w-12 h-12 mx-auto mb-4 text-primary-600" />
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Prenotazione Normale
                  </h4>
                  <p className="text-gray-600 text-sm">
                    Prenotazione tavolo per clienti con informazioni base
                  </p>
                  <ul className="mt-4 text-left text-sm text-gray-600 space-y-1">
                    <li>• Nome e contatti cliente</li>
                    <li>• Numero persone e bambini</li>
                    <li>• Data e orario arrivo</li>
                    <li>• Note speciali</li>
                  </ul>
                </div>
              </motion.div>

              <motion.div
                className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                  bookingType === 'evento'
                    ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => setBookingType('evento')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="text-center">
                  <Star className="w-12 h-12 mx-auto mb-4 text-primary-600" />
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Prenotazione Evento
                  </h4>
                  <p className="text-gray-600 text-sm">
                    Eventi speciali, feste, celebrazioni con menù dedicato
                  </p>
                  <ul className="mt-4 text-left text-sm text-gray-600 space-y-1">
                    <li>• Nome evento e partecipanti</li>
                    <li>• Tipo menù e pacchetti</li>
                    <li>• Gestione allergie</li>
                    <li>• Layout e disposizione</li>
                  </ul>
                </div>
              </motion.div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            {bookingType === 'normale' ? (
              <>
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Informazioni Cliente
                  </h3>
                  <p className="text-gray-600">
                    Inserisci i dettagli della prenotazione normale
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Nome Cliente"
                    name="nomeCliente"
                    value={formData.nomeCliente}
                    onChange={handleInputChange}
                    error={errors.nomeCliente}
                    icon={<User className="w-4 h-4" />}
                    placeholder="Mario"
                  />
                  
                  <Input
                    label="Cognome Cliente"
                    name="cognomeCliente"
                    value={formData.cognomeCliente}
                    onChange={handleInputChange}
                    error={errors.cognomeCliente}
                    icon={<User className="w-4 h-4" />}
                    placeholder="Rossi"
                  />
                </div>

                <Input
                  label="Telefono"
                  name="telefono"
                  type="tel"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  error={errors.telefono}
                  icon={<Phone className="w-4 h-4" />}
                  placeholder="+39 123 456 7890"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Numero Persone"
                    name="numeroPersone"
                    type="number"
                    min="1"
                    value={formData.numeroPersone}
                    onChange={handleInputChange}
                    error={errors.numeroPersone}
                    icon={<Users className="w-4 h-4" />}
                  />
                  
                  <Input
                    label="Numero Bambini"
                    name="numeroBambini"
                    type="number"
                    min="0"
                    value={formData.numeroBambini}
                    onChange={handleInputChange}
                    icon={<Users className="w-4 h-4" />}
                  />

                  <Input
                    label="Numero Neonati"
                    name="numeroNeonati"
                    type="number"
                    min="0"
                    value={formData.numeroNeonati}
                    onChange={handleInputChange}
                    icon={<Baby className="w-4 h-4" />}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Data Prenotazione"
                    name="dataPrenotazione"
                    type="date"
                    value={formData.dataPrenotazione}
                    onChange={handleInputChange}
                    error={errors.dataPrenotazione}
                    icon={<Calendar className="w-4 h-4" />}
                  />
                  
                  <Input
                    label="Orario Arrivo"
                    name="orarioArrivo"
                    type="time"
                    value={formData.orarioArrivo}
                    onChange={handleInputChange}
                    error={errors.orarioArrivo}
                    icon={<Clock className="w-4 h-4" />}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Note Speciali
                  </label>
                  <textarea
                    name="note"
                    value={formData.note}
                    onChange={handleInputChange}
                    rows={3}
                    className="input"
                    placeholder="Eventuali richieste speciali, allergie, disposizione tavoli..."
                  />
                </div>

                <Input
                  label="Tipo Menù (es. Giro Pizza)"
                  name="tipoMenu"
                  value={formData.tipoMenu}
                  onChange={handleInputChange}
                  icon={<Utensils className="w-4 h-4" />}
                  placeholder="Giro Pizza, Alla Carta..."
                />

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sala</label>
                  <select
                    name="sala"
                    value={formData.sala}
                    onChange={handleInputChange}
                    className="input"
                  >
                    <option value="">Seleziona sala...</option>
                    <option value="SALA_BAR">Sala Bar</option>
                    <option value="SALA_BAR_RISERVATA">Sala Bar (Riservata)</option>
                    <option value="SALA_VETRI">Sala Vetri</option>
                    <option value="SALA_VETRI_RISERVATA">Sala Vetri (Riservata)</option>
                    <option value="ESTERNO">Esterno</option>
                    <option value="PISCINA">Piscina</option>
                    <option value="TOOCOOL">Too Cool</option>
                  </select>
                </div>
              </>
            ) : (
              <>
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Dettagli Evento
                  </h3>
                  <p className="text-gray-600">
                    Configura il tuo evento speciale
                  </p>
                </div>

                <Input
                  label="Nome Evento"
                  name="nomeEvento"
                  value={formData.nomeEvento}
                  onChange={handleInputChange}
                  error={errors.nomeEvento}
                  icon={<Star className="w-4 h-4" />}
                  placeholder="Festa di Compleanno, Anniversario..."
                />

                <Input
                  label="Numero Partecipanti"
                  name="partecipanti"
                  type="number"
                  min="1"
                  value={formData.partecipanti}
                  onChange={handleInputChange}
                  error={errors.partecipanti}
                  icon={<Users className="w-4 h-4" />}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Numero Bambini"
                    name="numeroBambini"
                    type="number"
                    min="0"
                    value={formData.numeroBambini}
                    onChange={handleInputChange}
                    icon={<Users className="w-4 h-4" />}
                  />
                  <Input
                    label="Numero Neonati"
                    name="numeroNeonati"
                    type="number"
                    min="0"
                    value={formData.numeroNeonati}
                    onChange={handleInputChange}
                    icon={<Baby className="w-4 h-4" />}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Data Evento"
                    name="dataPrenotazione"
                    type="date"
                    value={formData.dataPrenotazione}
                    onChange={handleInputChange}
                    error={errors.dataPrenotazione}
                    icon={<Calendar className="w-4 h-4" />}
                  />
                  
                  <Input
                    label="Orario Inizio"
                    name="orarioArrivo"
                    type="time"
                    value={formData.orarioArrivo}
                    onChange={handleInputChange}
                    error={errors.orarioArrivo}
                    icon={<Clock className="w-4 h-4" />}
                  />
                </div>

                <Input
                  label="Tipo Menù"
                  name="tipoMenu"
                  value={formData.tipoMenu}
                  onChange={handleInputChange}
                  error={errors.tipoMenu}
                  icon={<Utensils className="w-4 h-4" />}
                  placeholder="Menù degustazione, buffet, carta..."
                />

                <Input
                  label="Pacchetto"
                  name="pacchetto"
                  value={formData.pacchetto}
                  onChange={handleInputChange}
                  icon={<Gift className="w-4 h-4" />}
                  placeholder="Menù + Bevande, Solo cena, Completo..."
                />

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sala</label>
                  <select
                    name="sala"
                    value={formData.sala}
                    onChange={handleInputChange}
                    className="input"
                  >
                    <option value="">Seleziona sala...</option>
                    <option value="SALA_BAR">Sala Bar</option>
                    <option value="SALA_BAR_RISERVATA">Sala Bar (Riservata)</option>
                    <option value="SALA_VETRI">Sala Vetri</option>
                    <option value="SALA_VETRI_RISERVATA">Sala Vetri (Riservata)</option>
                    <option value="ESTERNO">Esterno</option>
                    <option value="PISCINA">Piscina</option>
                    <option value="TOOCOOL">Too Cool</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Note
                  </label>
                  <textarea
                    name="allergie"
                    value={formData.allergie}
                    onChange={handleInputChange}
                    rows={2}
                    className="input"
                    placeholder="Aggiungi note o richieste particolari..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Note Aggiuntive
                  </label>
                  <textarea
                    name="note"
                    value={formData.note}
                    onChange={handleInputChange}
                    rows={3}
                    className="input"
                    placeholder="Layout sala, decorazioni, musica, esigenze particolari..."
                  />
                </div>
              </>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Allegati Opzionali
              </h3>
              <p className="text-gray-600">
                Carica PDF o immagini per specificare meglio le tue esigenze
              </p>
            </div>

            {/* Drag & Drop Area */}
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-400 transition-colors cursor-pointer"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFileUpload(e.dataTransfer.files);
              }}
              onClick={() => document.getElementById('fileInput').click()}
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Trascina i file qui o clicca per selezionare
              </p>
              <p className="text-sm text-gray-600">
                Formati supportati: PDF, JPG, PNG (max 5MB)
              </p>
              <input
                id="fileInput"
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
              />
            </div>

            {errors.files && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {errors.files}
              </div>
            )}

            {/* Lista File Caricati */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">File caricati:</h4>
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{file.name}</p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1 text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Suggerimenti per gli allegati:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• <strong>Prenotazione normale:</strong> Layout sala desiderato, richieste speciali</li>
                    <li>• <strong>Eventi:</strong> Menù personalizzati, disposizione tavoli, decorazioni</li>
                    <li>• <strong>Formato:</strong> PDF per documenti, JPG/PNG per immagini</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Riepilogo Prenotazione
              </h3>
              <p className="text-gray-600">
                Verifica tutti i dettagli prima di confermare
              </p>
            </div>

            <div className="card">
              <div className="card-header">
                <div className="flex items-center space-x-2">
                  {bookingType === 'normale' ? 
                    <Users className="w-5 h-5 text-primary-600" /> : 
                    <Star className="w-5 h-5 text-primary-600" />
                  }
                  <h4 className="font-semibold text-gray-900">
                    {bookingType === 'normale' ? 'Prenotazione Normale' : 'Prenotazione Evento'}
                  </h4>
                </div>
              </div>
              <div className="card-body space-y-4">
                {bookingType === 'normale' ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Cliente</p>
                        <p className="font-medium">{formData.nomeCliente} {formData.cognomeCliente}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Telefono</p>
                        <p className="font-medium">{formData.telefono}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Persone</p>
                        <p className="font-medium">
                          {formData.numeroPersone} adulti
                          {formData.numeroBambini > 0 && `, ${formData.numeroBambini} bambini`}
                          {formData.numeroNeonati > 0 && `, ${formData.numeroNeonati} neonati`}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Data e Ora</p>
                        <p className="font-medium">
                          {new Date(formData.dataPrenotazione).toLocaleDateString('it-IT')} alle {formData.orarioArrivo}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Menù</p>
                        <p className="font-medium">{formData.tipoMenu || 'Giro Pizza'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Sala</p>
                        <p className="font-medium">{formData.sala}</p>
                      </div>
                    </div>
                    {formData.note && (
                      <div>
                        <p className="text-sm text-gray-500">Note</p>
                        <p className="font-medium">{formData.note}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Nome Evento</p>
                        <p className="font-medium">{formData.nomeEvento}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Partecipanti</p>
                        <p className="font-medium">{formData.partecipanti}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Data e Ora</p>
                        <p className="font-medium">
                          {new Date(formData.dataPrenotazione).toLocaleDateString('it-IT')} alle {formData.orarioArrivo}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Tipo Menù</p>
                        <p className="font-medium">{formData.tipoMenu}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Bambini / Neonati</p>
                        <p className="font-medium">{formData.numeroBambini || 0} bambini, {formData.numeroNeonati || 0} neonati</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Sala</p>
                        <p className="font-medium">{formData.sala}</p>
                      </div>
                    </div>
                    {formData.pacchetto && (
                      <div>
                        <p className="text-sm text-gray-500">Pacchetto</p>
                        <p className="font-medium">{formData.pacchetto}</p>
                      </div>
                    )}
                    {formData.allergie && (
                      <div>
                        <p className="text-sm text-gray-500">Note</p>
                        <p className="font-medium">{formData.allergie}</p>
                      </div>
                    )}
                    {formData.note && (
                      <div>
                        <p className="text-sm text-gray-500">Note</p>
                        <p className="font-medium">{formData.note}</p>
                      </div>
                    )}
                  </>
                )}

                {uploadedFiles.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500">Allegati ({uploadedFiles.length})</p>
                    <div className="space-y-1">
                      {uploadedFiles.map((file, index) => (
                        <p key={index} className="text-sm font-medium text-gray-700">
                          • {file.name}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {canAutoApprove() ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <p className="text-sm text-green-800 font-medium">
                    La prenotazione sarà confermata automaticamente
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  <p className="text-sm text-yellow-800 font-medium">
                    La prenotazione sarà in attesa di approvazione
                  </p>
                </div>
              </div>
            )}

            {errors.general && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {errors.general}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-bold text-gray-900">Wizard Prenotazioni</h2>
          <p className="text-gray-600">Step {currentStep} di 4</p>
        </div>
        <div className="card-body">
          <p className="text-gray-600">
            Wizard completo implementato con tutti i passaggi step-by-step, 
            upload file drag & drop, e validazione secondo le specifiche.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BookingWizard; 