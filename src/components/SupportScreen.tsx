import React, { useState } from 'react';
import { Screen } from '../types';
import { useAnnouncer } from './LiveAnnouncer';

interface SupportScreenProps {
  onNavigate: (screen: Screen) => void;
  onOpenSpecialistModal: () => void;
  onOpenVpatModal: () => void;
}

export const SupportScreen: React.FC<SupportScreenProps> = ({
  onNavigate,
  onOpenSpecialistModal,
  onOpenVpatModal,
}) => {
  const { announce } = useAnnouncer();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: '¿Cómo tramitar la adquisición mediante ayudas públicas o CEAPAT?',
      a: 'Emitimos una factura proforma oficial con código de catalogación asistiva y código de proveedor homologado. Nuestro equipo técnico redacta el informe justificativo para la solicitud de prestación ortoprotésica o subvención para el empleo.',
    },
    {
      q: '¿Los productos incluyen preconfiguración accesible?',
      a: 'Sí. Todos los envíos de hardware pueden incluir preinstalación de síntesis vocal, configuración de scripts para NVDA o JAWS, y rotulado de cajas y puertos en braille sin ningún coste adicional.',
    },
    {
      q: '¿Cuál es la política de garantía y periodo de adaptación?',
      a: 'Ofrecemos 3 años de garantía oficial en todo el hardware asistivo y 30 días naturales de periodo de prueba. Si el dispositivo no se adapta a la ergonomía del usuario, gestionamos la recogida y reembolso íntegro.',
    },
    {
      q: '¿Cómo se entregan las licencias electrónicas de software?',
      a: 'La entrega de software como Aura Reader Suite o ClearView Pro es inmediata por correo electrónico mediante certificado digital accesible, junto a las guías de instalación rápida en formato audiolibro y PDF/UA.',
    },
  ];

  const toggleFaq = (index: number) => {
    const next = activeFaq === index ? null : index;
    setActiveFaq(next);
    if (next !== null) {
      announce(`Desplegada respuesta: ${faqs[index].q}`);
    } else {
      announce(`Plegada respuesta: ${faqs[index].q}`);
    }
  };

  return (
    <div className="sky-theme support-light w-full flex flex-col gap-8 py-6 px-4 md:px-8 max-w-7xl mx-auto text-slate-900">
      {/* Breadcrumbs */}
      <nav aria-label="Ruta de navegación" className="text-xs text-slate-300 flex items-center gap-2 border-b border-[#1E3A5F] pb-3">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          aria-label="Enlace: Inicio, sección Ruta de navegación"
          data-speech="Enlace: Inicio, sección Ruta de navegación"
          className="hover:text-[#00FFFF] hover:underline cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00FFFF] rounded"
        >
          Inicio
        </button>
        <span aria-hidden="true" className="text-[#00FFFF]">/</span>
        <span className="font-black text-[#FACC15]" aria-current="page">
          Centro de Asistencia & Soporte Técnico
        </span>
      </nav>

      {/* Header */}
      <div>
        <span className="px-3 py-1 bg-[#00FFFF]/20 text-[#00FFFF] border border-[#00FFFF]/50 text-xs font-black rounded-full inline-block uppercase tracking-wider">
          Soporte Especializado 24/7
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-white mt-3">
          Centro de Asistencia y <span className="text-[#00FFFF]">Servicios de Accesibilidad</span>
        </h1>
        <p className="text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
          Ponemos a tu disposición ingenieros de tecnología asistiva, técnicos de soporte remoto y asesores de ayudas públicas.
        </p>
      </div>

      {/* 3 Support Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          style={{
            backgroundColor: '#0B192C',
            borderColor: '#00FFFF',
            borderRadius: '16px',
          }}
          className="border-2 p-6 shadow-lg flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-[#FACC15] text-[#0B192C] flex items-center justify-center mb-4 shadow-md">
              <span className="material-symbols-outlined text-[28px]" aria-hidden="true">support_agent</span>
            </div>
            <h2 className="text-lg font-black text-white mb-2">
              Asesoría Técnica Gratuita
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Consulta con un especialista para seleccionar el lector de pantalla, línea braille o conmutador ideal para tu puesto de trabajo.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenSpecialistModal}
            aria-label="Botón: Solicitar Asesor, abrir formulario de asesoría técnica especializada"
            data-speech="Botón: Solicitar Asesor, abrir formulario de asesoría técnica especializada"
            style={{
              backgroundColor: '#FACC15',
              color: '#0B192C',
              borderColor: '#FDE047',
            }}
            className="mt-6 w-full py-3 border-2 font-black text-xs rounded-xl transition-all hover:brightness-105 active:scale-[0.99] focus-visible:outline focus-visible:outline-3 focus-visible:outline-white cursor-pointer shadow-md"
          >
            Solicitar Asesor
          </button>
        </div>

        <div
          style={{
            backgroundColor: '#0B192C',
            borderColor: '#FACC15',
            borderRadius: '16px',
          }}
          className="border-2 p-6 shadow-lg flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-[#00FFFF] text-[#0B192C] flex items-center justify-center mb-4 shadow-md">
              <span className="material-symbols-outlined text-[28px]" aria-hidden="true">description</span>
            </div>
            <h2 className="text-lg font-black text-white mb-2">
              Informes VPAT & Auditorías
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Descarga certificados de conformidad EN 301 549 y Section 508 con desglose de criterios técnicos para expedientes de compra.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenVpatModal}
            aria-label="Botón: Ver Declaraciones VPAT, abrir informes de conformidad y auditorías técnicas"
            data-speech="Botón: Ver Declaraciones VPAT, abrir informes de conformidad y auditorías técnicas"
            style={{
              backgroundColor: '#00FFFF',
              color: '#0B192C',
              borderColor: '#00FFFF',
            }}
            className="mt-6 w-full py-3 border-2 font-black text-xs rounded-xl transition-all hover:brightness-105 active:scale-[0.99] focus-visible:outline focus-visible:outline-3 focus-visible:outline-white cursor-pointer shadow-md"
          >
            Ver Declaraciones VPAT
          </button>
        </div>

        <div
          style={{
            backgroundColor: '#0B192C',
            borderColor: '#1E3A5F',
            borderRadius: '16px',
          }}
          className="border-2 p-6 shadow-lg flex flex-col justify-between"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-[#112240] text-[#00FFFF] border border-[#00FFFF]/50 flex items-center justify-center mb-4 shadow-md">
              <span className="material-symbols-outlined text-[28px]" aria-hidden="true">chat</span>
            </div>
            <h2 className="text-lg font-black text-white mb-2">
              Canal WhatsApp & Asistencia Rápida
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Atención directa adaptada a mensajería de texto y notas de voz para resolución de dudas operativas y seguimiento de envíos.
            </p>
          </div>
          <a
            href="tel:+34900000000"
            aria-label="Enlace: Línea Gratuita de Atención, llamar al teléfono gratuito novecientos triple cero"
            data-speech="Enlace: Línea Gratuita de Atención, llamar al teléfono gratuito novecientos triple cero"
            className="mt-6 w-full py-3 bg-[#112240] hover:bg-[#1B3A60] text-[#00FFFF] border-2 border-[#00FFFF] font-black text-xs rounded-xl text-center block focus-visible:outline focus-visible:outline-3 focus-visible:outline-[#00FFFF] cursor-pointer transition-all shadow-md"
          >
            Línea Gratuita: 900 000 000
          </a>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <section
        aria-label="Preguntas frecuentes sobre accesibilidad"
        style={{
          backgroundColor: '#0B192C',
          borderColor: '#1E3A5F',
          borderRadius: '16px',
        }}
        className="border-2 p-6 sm:p-8 shadow-lg"
      >
        <h2 className="text-xl font-black text-white mb-4 pb-3 border-b border-[#1E3A5F] flex items-center gap-2.5">
          <span className="material-symbols-outlined text-[24px] text-[#FACC15]" aria-hidden="true">
            help
          </span>
          <span>Preguntas Frecuentes sobre Soluciones Asistivas</span>
        </h2>

        <div className="divide-y divide-[#1E3A5F]">
          {faqs.map((faq, index) => (
            <div key={index} className="py-4">
              <button
                type="button"
                aria-expanded={activeFaq === index}
                onClick={() => toggleFaq(index)}
                aria-label={`Botón: Pregunta ${index + 1}, ${faq.q}. ${activeFaq === index ? 'Plegar respuesta' : 'Desplegar respuesta'}`}
                data-speech={`Botón: Pregunta: ${faq.q}`}
                className="w-full text-left flex items-center justify-between gap-4 font-bold text-sm text-white hover:text-[#00FFFF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00FFFF] rounded cursor-pointer transition-colors p-1"
              >
                <span>{faq.q}</span>
                <span className="material-symbols-outlined text-[22px] shrink-0 text-[#00FFFF]" aria-hidden="true">
                  {activeFaq === index ? 'expand_less' : 'expand_more'}
                </span>
              </button>
              {activeFaq === index && (
                <p className="mt-3 text-xs text-slate-200 leading-relaxed pl-4 border-l-3 border-[#00FFFF] bg-[#070F1E] p-3 rounded-r-xl">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
