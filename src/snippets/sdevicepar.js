'use strict';

module.exports = {
    Material: {
        'Silicon (full)': {
            desc: 'Material Silicon 完整骨架（Epsilon + Bandgap + Scharfetter）',
            lines: [
                'Material = "Silicon" {',
                '',
                '\tEpsilon {',
                '\t\tepsilon = ${14:11.7}',
                '\t}',
                '',
                '\tBandgap {',
                '\t\tChi0 = ${15:4.05}',
                '\t\tEg0 = ${16:1.12}',
                '\t\talpha = ${17:4.73e-4}',
                '\t\tbeta = ${18:636}',
                '\t\tTpar = ${19:300}',
                '\t}',
                '',
                '\tScharfetter * relation and trap level for SRH recombination:',
                '\t{ * tau = taumin + ( taumax - taumin ) / ( 1 + ( N/Nref )^gamma)',
                '\t\ttaumin = ${1:0.0e+00} ,\t${2:0.0e+00}\t# [s]',
                '\t\ttaumax = ${3:1.0e-07} ,\t${4:1.0e-07}\t# [s]',
                '\t\tNref = ${5:1.0e+16} ,\t${6:1.0e+16}\t# [cm^(-3)]',
                '\t\tgamma = ${7:1} ,\t\t${8:1}\t\t# [1]',
                '\t\tTalpha = ${9:-1.5e+00} ,\t${10:-1.5e+00}\t# [1]',
                '\t\tTcoeff = ${11:2.55} ,\t${12:2.55}\t\t# [1]',
                '\t\tEtrap = ${13:0.0e+00}\t\t\t# [eV]',
                '\t}',
                '',
                '}',
            ],
        },
        'Oxide (full)': {
            desc: 'Material Oxide 完整骨架（Epsilon）',
            lines: [
                'Material = "Oxide" {',
                '',
                '\tEpsilon {',
                '\t\tepsilon = ${1:3.9}',
                '\t}',
                '',
                '}',
            ],
        },
        'Generic (with Insert)': {
            desc: 'Material 通用骨架（引用外部 .par 文件）',
            lines: [
                'Material = "${1:material}" {',
                '\tInsert="${1:material}.par"',
                '\t$0',
                '}',
            ],
        },
    },
    Region: {
        'Region (generic)': {
            desc: 'Region 顶层块（通用模板）',
            lines: [
                'Region = "${1:name}" {',
                '\t$0',
                '}',
            ],
        },
    },
    Electrode: {
        'Electrode (generic)': {
            desc: 'Electrode 顶层块（通用模板）',
            lines: [
                'Electrode = "${1:name}" {',
                '\t$0',
                '}',
            ],
        },
    },
    Interface: {
        'RegionInterface': {
            desc: 'RegionInterface 顶层块（区域间界面参数）',
            lines: [
                'RegionInterface = "${1:region1}/${2:region2}" {',
                '\t$0',
                '}',
            ],
        },
        'MaterialInterface': {
            desc: 'MaterialInterface 顶层块（材料间界面参数）',
            lines: [
                'MaterialInterface = "${1:mat1}/${2:mat2}" {',
                '\t$0',
                '}',
            ],
        },
    },
    Section: {
        Epsilon: {
            desc: '介电常数 (Silicon 默认值)',
            lines: [
                'Epsilon {',
                '\tepsilon = ${1:11.7}',
                '}',
            ],
        },
        Bandgap: {
            desc: '带隙 S-type model (Silicon 默认值)',
            lines: [
                'Bandgap {',
                '\t* S-type bandgap model: Eg(T) = Eg0 - alpha*T^2/(T+beta)',
                '\tChi0 = ${1:4.05}',
                '\tEg0 = ${2:1.12}',
                '\talpha = ${3:4.73e-4}',
                '\tbeta = ${4:636}',
                '\tTpar = ${5:300}',
                '}',
            ],
        },
        'Scharfetter (SRH)': {
            desc: 'SRH 复合寿命 (Silicon 默认值)',
            lines: [
                'Scharfetter * relation and trap level for SRH recombination:',
                '{ * tau = taumin + ( taumax - taumin ) / ( 1 + ( N/Nref )^gamma)',
                '  * tau(T) = tau * ( (T/300)^Talpha )          (TempDep)',
                '  * tau(T) = tau * exp( Tcoeff * ((T/300)-1) ) (ExpTempDep)',
                '\ttaumin = ${1:0.0e+00} ,\t${2:0.0e+00}\t# [s]',
                '\ttaumax = ${3:1.0e-07} ,\t${4:1.0e-07}\t# [s]',
                '\tNref = ${5:1.0e+16} ,\t${6:1.0e+16}\t# [cm^(-3)]',
                '\tgamma = ${7:1} ,\t\t${8:1}\t\t# [1]',
                '\tTalpha = ${9:-1.5e+00} ,\t${10:-1.5e+00}\t# [1]',
                '\tTcoeff = ${11:2.55} ,\t${12:2.55}\t\t# [1]',
                '\tEtrap = ${13:0.0e+00}\t\t\t# [eV]',
                '}',
            ],
        },
        'ConstantMobility': {
            desc: '恒定迁移率 (Silicon 默认值)',
            lines: [
                'ConstantMobility:',
                '{ * mu_const = mumax (T/T0)^(-Exponent)',
                '\tmumax = ${1:1414} ,\t${2:470}\t# [cm^2/(Vs)]',
                '\tExponent = ${3:2.42} ,\t${4:2.2}\t# [1]',
                '}',
            ],
        },
        'DopingDependence': {
            desc: '掺杂相关迁移率 Masetti model (Silicon 默认值)',
            lines: [
                'DopingDependence:',
                '{ * Masetti model',
                '\tmumin = ${1:55.2} ,\t${2:49.7}\t# [cm^2/(Vs)]',
                '\tmumax = ${3:1414} ,\t${4:470}\t# [cm^2/(Vs)]',
                '\tNref = ${5:1.072e+17} ,\t${6:1.606e+17}\t# [cm^(-3)]',
                '\talpha = ${7:-2.3} ,\t${8:-2.2}\t# [1]',
                '}',
            ],
        },
        'HighFieldDependence': {
            desc: '高场依赖迁移率 Caughey-Thomas (Silicon 默认值)',
            lines: [
                'HighFieldDependence:',
                '{ * Caughey-Thomas model',
                '\tbeta = ${1:1.109} ,\t${2:1.213}\t# [1]',
                '\tvsat = ${3:1.07e+07} ,\t${4:8.37e+06}\t# [cm/s]',
                '}',
            ],
        },
        Auger: {
            desc: 'Auger 复合系数 (Silicon 默认值)',
            lines: [
                'Auger * coefficients:',
                '{',
                '\tCn = ${1:2.8e-31}\t# [cm^6/s]',
                '\tCp = ${2:9.9e-32}\t# [cm^6/s]',
                '}',
            ],
        },
        'RadiativeRecombination': {
            desc: '辐射复合系数 (Silicon 默认值)',
            lines: [
                'RadiativeRecombination * coefficients:',
                '{',
                '\tC = ${1:1.1e-14}\t# [cm^3/s]',
                '}',
            ],
        },
        Kappa: {
            desc: '热导率 (Silicon 默认值)',
            lines: [
                'Kappa',
                '{ * Thermal conductivity',
                '\tkappa = ${1:1.56}\t# [W/(cm*K)]',
                '}',
            ],
        },
        Ionization: {
            desc: '不完全电离 Species 模板',
            lines: [
                'Ionization {',
                '\tSpecies ("${1:ConcentrationName}") {',
                '\t\tE_0 = ${2:0.045}\t# [eV]',
                '\t\talpha = ${3:0}\t# [eV*cm]',
                '\t\tg = ${4:2}\t# [1]',
                '\t\tXsec = ${5:1.0e-12}\t# [cm^2]',
                '\t}',
                '}',
            ],
        },
    },
    Misc: {
        'Insert': {
            desc: 'Insert 引用外部参数文件',
            lines: [
                'Insert="${1:filename}.par"',
            ],
        },
        'LatticeParameters': {
            desc: '晶格参数（定义模拟坐标系）',
            lines: [
                'LatticeParameters {',
                '\tX = (${1:0} ${2:0} ${3:-1})',
                '\tY = (${4:1} ${5:0} ${6:0})',
                '}',
            ],
        },
        'Thermionic': {
            desc: '热电子发射模型',
            lines: [
                'Thermionic {',
                '\tFormula = ${1:1}',
                '}',
            ],
        },
        'SurfaceRecombination': {
            desc: '表面复合',
            lines: [
                'SurfaceRecombination * surface SRH recombination:',
                '{',
                '\tS0 = ${1:0} ,\t${2:0}\t# [cm/s]',
                '\tSref = ${3:0}\t# [1]',
                '}',
            ],
        },
    },
};
