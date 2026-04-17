import React, { useState } from 'react';

const INITIAL_STATE = {
  codigo: '',
  tipo: 'ENTRADA',
  regime: '',
  uf: '',
  // ICMS
  cstIcms: '',
  aliquotaIcms: 0,
  reducaoBcIcms: 0,
  // ... (mantenha todos os outros campos que você já definiu)
  aliquotaIbs: 0
};

const GradeTributariaModule = () => {
  const [formData, setFormData] = useState(INITIAL_STATE);

  // Função para atualizar os campos genericamente
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Dados Tributários Enviados:', formData);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Configuração de Grade Tributária</h2>
      
      <form onSubmit={handleSubmit}>
        {/* Seção Identificação */}
        <fieldset style={{ marginBottom: '20px', padding: '15px' }}>
          <legend><strong>Identificação</strong></legend>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <label>
              Código:
              <input type="text" name="codigo" value={formData.codigo} onChange={handleChange} style={{ width: '100%' }} />
            </label>
            <label>
              Tipo:
              <select name="tipo" value={formData.tipo} onChange={handleChange} style={{ width: '100%' }}>
                <option value="ENTRADA">Entrada</option>
                <option value="SAIDA">Saída</option>
              </select>
            </label>
          </div>
        </fieldset>

        {/* Seção Reforma Tributária (CBS/IBS) */}
        <fieldset style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f0f9ff' }}>
          <legend><strong>Reforma Tributária</strong></legend>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <label>
              CST CBS/IBS:
              <input type="text" name="cstCbsIbs" value={formData.cstCbsIbs} onChange={handleChange} />
            </label>
            <label>
              Alíquota CBS (%):
              <input type="number" name="aliquotaCbs" value={formData.aliquotaCbs} onChange={handleChange} />
            </label>
            <label>
              Alíquota IBS (%):
              <input type="number" name="aliquotaIbs" value={formData.aliquotaIbs} onChange={handleChange} />
            </label>
          </div>
        </fieldset>

        <button type="submit" style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>
          Salvar Configurações
        </button>
      </form>
    </div>
  );
};

// ESSA LINHA É A MAIS IMPORTANTE: Ela exporta o componente que acabamos de criar
export default GradeTributariaModule;