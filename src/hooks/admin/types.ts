export interface FiltrosAulas {
  dataInicio: string;
  dataFim: string;
  professor: string;
  nivel: string;
}

export interface FiltrosProfessores {
  periodo: string;
  nivel: string;
}

export interface AulaHistorico {
  id: string;
  dia_semana: number;
  horario: string;
  nivel: string;
  capacidade: number;
  professor_nome: string;
  data_aula?: string;
  confirmados?: any[];
  presentes?: any[];
  faltas?: any[];
  listaEspera?: any[];
}

export interface EstatisticasPresenca {
  taxaPresenca: number;
  faltasSemAviso: number;
  faltasComAviso: number;
}

export interface EstatisticasProfessor {
  id: string;
  nome: string;
  totalAulas: number;
  totalVagas: number;
  alunosAtendidos: number;
  taxaOcupacao: number;
  mediaPresenca: number;
}

export interface Professor {
  id: string;
  nome: string;
}