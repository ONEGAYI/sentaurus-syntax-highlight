module.exports = {
    Deposit: {
        Simple: {
            desc: 'Simple deposition',
            lines: [
                'deposit ${1:material} thickness= ${2:n}${3:um} ${4|"isotropic","anisotropic"}',
            ],
        },
        Rate: {
            desc: 'Deposition with specified rate',
            lines: [
                'deposit material= ${1:material} type= ${6|"isotropic","anisotropic"} \\',
                '  rate=${2:n}${3:um/min} time=${4:n}${5:min}',
            ],
        },
        Doping: {
            desc: 'Deposition with doping',
            lines: [
                'deposit material= ${1:material} type= ${10|"isotropic","anisotropic"} \\',
                '  rate= ${2:n}${3:um/min} time= ${4:n}${5:min} \\',
                '  doping= {${6:dopant1} ${7:dopant2} ...} | fields.values= {${6:dopant1}= ${8:value1} ${7:dopant2}= ${9:value2} ...}',
            ],
        },
        Fill: {
            desc: 'Fill deposition',
            lines: [
                'deposit material= ${1:material} type= fill coord= ${2:n}${3:um}',
            ],
        },
    },
    Diffuse: {
        Simple: {
            desc: 'Simple diffusion',
            lines: [
                'diffuse temperature= ${1:n}${2:C} t.final= ${3:n}${4:C} time= ${5:n}${6:s}',
            ],
        },
        Epi: {
            desc: 'Epitaxial diffusion',
            lines: [
                'diffuse Epi epi.thickness= ${1:n}${2:um} \\',
                '  epi.doping= {${3:dopant1}=${4:value1} ${5:dopant2}=${6:value2} ...} \\',
                '  temperature= ${7:n}${8:C} t.final= ${9:n}${10:C} time= ${11:n}${12:min}',
            ],
        },
        Tempramp: {
            desc: 'Temperature ramp diffusion with gas flow',
            lines: [
                'gas_flow name= ${1:gas_name_1} pressure= ${2:n}${3:atm} \\',
                '  flows= {O2= ${4:n}${5:l/min} H2O= ${6:n}${7:l/min} H2= ${8:n}${9:l/min} N2= ${10:n}${11:l/min}}',
                'gas_flow name= ${12:gas_name_2} pressure= ${13:n}${14:atm} \\',
                '  flows= {O2= ${15:n}${16:l/min} H2O= ${17:n}${18:l/min} H2= ${19:n}${20:l/min} N2= ${21:n}${22:l/min}}',
                'temp_ramp name= ${23:temp_name} temperature= ${24:n}${25:C} t.final= ${26:n}${27:C} \\',
                '  time= ${28:n}${29:s} gas.flow= ${1:gas_name_1}',
                'temp_ramp name= ${23:temp_name} temperature= ${30:n}${31:C} t.final= ${32:n}${33:C} \\',
                '  time= ${34:n}${35:s} gas.flow= ${12:gas_name_2}',
                'temp_ramp name= ${23:temp_name} temperature= ${36:n}${37:C} t.final= ${38:n}${39:C} \\',
                '  time= ${40:n}${41:s}',
                'diffuse temp.ramp= ${23:temp_name}',
            ],
        },
    },
    Etch: {
        Simple: {
            desc: 'Simple etching',
            lines: [
                'etch ${1:material} thickness= ${2:n}${3:um} ${4|"isotropic","anisotropic"}',
            ],
        },
        Rate: {
            desc: 'Etching with specified rate',
            lines: [
                'etch material= {${1:material1} ${2:material2} ...} \\',
                '  rate= {${3:rate1}${4:um/min} ${5:rate2}${6:um/min} ...} \\',
                '  time= ${7:n}${8:min} type= ${9|"isotropic","anisotropic"}',
            ],
        },
        Directional: {
            desc: 'Directional etching',
            lines: [
                'etch material= ${1:material} rate= ${2:rate}${3:um/min} time= ${4:n}${5:min} \\',
                '  type= directional direction= {${6:n1} ${7:n2} ${8:n3}}',
            ],
        },
        Polygon: {
            desc: 'Polygon etching',
            lines: [
                'etch material= ${1:material} type= polygon \\',
                '  polygon= {${2:x1}${3:um} ${4:y1}${5:um} ${6:x2}${7:um} ${8:y2}${9:um} ...}',
            ],
        },
        Trapezoidal: {
            desc: 'Trapezoidal etching',
            lines: [
                'etch ${1:material} thickness= ${2:n}${3:um} trapezoidal angle= ${4:n} undercut= ${5:n}${6:um}',
            ],
        },
        Strip: {
            desc: 'Strip material',
            lines: [
                'strip ${1:material}',
            ],
        },
        Cmp: {
            desc: 'CMP chemical mechanical polishing',
            lines: [
                'etch type= cmp coord= ${1:n}${2:um}',
            ],
        },
    },
    Implant: {
        Simple: {
            desc: 'Simple ion implantation',
            lines: [
                'implant ${1:dopant} dose= ${2:n}${3:cm-2} energy= ${4:n}${5:keV} \\',
                '  tilt= ${6:n}${7:degree} rotation= ${8:n}${9:degree}',
            ],
        },
        Mc: {
            desc: 'Monte Carlo implantation',
            lines: [
                'implant ${1:dopant} dose= ${2:n}${3:cm-2} energy= ${4:n}${5:keV} \\',
                '  tilt= ${6:n}${7:degree} rotation= ${8:n}${9:degree} sentaurus.mc',
            ],
        },
        Quad: {
            desc: 'Quad rotation implantation',
            lines: [
                'implant ${1:dopant} dose= ${2:n}${3:cm-2} energy= ${4:n}${5:keV} \\',
                '  tilt= ${6:n}${7:degree} rotation= ${8:n}${9:degree} mult.rot= 4',
            ],
        },
    },
    ICWB: {
        Line: {
            desc: 'Grid line definition and simulation domain setup',
            lines: [
                '# - Primary dimensions: Edit as needed!',
                'line x location= -5.0       spacing= 100.0 ',
                'line x location=  0.0       spacing= 100.0 tag= top',
                'line x location= 10.0       spacing= 100.0 tag= bottom',
                '',
                '# - Get dimension of the simulation domain:',
                'set DIM [icwb dimension]',
                '',
                '# - Query utility: Returns the bounding box of the simulation',
                'set Ymin [icwb bbox left ]',
                'set Ymax [icwb bbox right]',
                'set Zmin [icwb bbox back ]',
                'set Zmax [icwb bbox front]',
                '',
                'if { $DIM == 3 } {',
                '\tline y location= $Ymin   spacing= 100.0 tag= left',
                '\tline y location= $Ymax   spacing= 100.0 tag= right',
                '\tline z location= $Zmin   spacing= 100.0 tag= back',
                '\tline z location= $Zmax   spacing= 100.0 tag= front',
                '\tset Ydim "ylo= left yhi= right"',
                '\tset Zdim "zlo= back zhi= front"',
                '} elseif { $DIM == 2 } {',
                '\tline y location= $Ymin   spacing= 100.0 tag= left',
                '\tline y location= $Ymax   spacing= 100.0 tag= right',
                '\tset Ydim "ylo= left yhi= right"',
                '\tset Zdim ""',
                '} else {',
                '\tline y location= -0.5   spacing= 100.0 tag= left',
                '\tline y location=  0.5   spacing= 100.0 tag= right',
                '\tset Ydim "ylo= left yhi= right"',
                '\tset Zdim ""',
                '} ',
                '',
                'eval region Silicon xlo= top xhi= bottom $Ydim $Zdim',
            ],
        },
        'Load-layout': {
            desc: 'Load ICWB layout file',
            lines: [
                'icwb filename= "${1:filename_lyt.mac}" [scale=${2:n}]',
                'icwb domain= "${3:domain-name}"',
                '',
                '# - Composit Domains:',
                '# icwb domain= {"${3:domain-name-1}" "${4:domain-name-2}" ...}',
                '',
                '# - Apply stretch',
                '# icwb stretch name= "${5:stretch_name}" value= ${6:amount}',
            ],
        },
        'Create-mask': {
            desc: 'Create ICWB mask',
            lines: [
                'icwb.create.mask layer.name= ${1:string}|${2:string_list} [name= ${3:string}] \\',
                '  [polarity= positive|negative] [info= ${4:n}]',
            ],
        },
        'Contact-mask': {
            desc: 'ICWB contact mask definition',
            lines: [
                'icwb.contact.mask layer.name= ${1:string}|${2:string_list} [name= ${3:string}] \\',
                '  ${4:other_options} [info= ${5:n}]',
                '# - Examples for <other_options>:',
                '# (a) point aluminum replace x= -2.0',
                '# (b) box polysilicon adjacent.material=oxide  xlo= -2.05 xhi=-1.95',
            ],
        },
        Sliceangle: {
            desc: 'Slice angle and wafer orientation setup',
            lines: [
                'set sliceangle -90',
                'set SliceAngleOffset [icwb slice.angle.offset]',
                '',
                'init Silicon field= ${1:dopant} concentration= ${2:value} wafer.orient=100 \\',
                '  slice.angle=[expr $sliceangle+$SliceAngleOffset]',
            ],
        },
    },
    Init: {
        CMOS: {
            desc: 'CMOS initial mesh and substrate definition',
            lines: [
                'line x location= 0.0${1:um}   spacing= 0.001${1:um} tag= top',
                'line x location= 0.05${1:um}  spacing= 0.004${1:um}',
                'line x location= 0.50${1:um}  spacing= 0.02${1:um}',
                'line x location= 10.0${1:um}  spacing= 1.0${1:um}   tag= bottom',
                'line y location= 0.0${1:um}   spacing= 0.1${1:um}   tag= mid',
                'line y location= 0.3${1:um}   spacing= 0.1${1:um}   tag= right',
                'region silicon substrate xlo= top xhi= bottom ylo= mid yhi= right',
                'init field= ${2:dopant} concentration= ${3:n}${4:cm-3}',
            ],
        },
    },
    Mask: {
        Simple: {
            desc: 'Simple mask definition',
            lines: [
                'mask name= ${1:name} left= ${2:n}${3:um} right= ${4:n}${5:um} [negative]',
            ],
        },
        Segments: {
            desc: 'Segmented mask definition',
            lines: [
                'mask name= ${1:name} segments= {${2:x1}${3:um} ${4:x2}${5:um} ...} [negative]',
            ],
        },
        Mask3D: {
            desc: '3D mask definition',
            lines: [
                'mask name= ${1:name} left= ${2:n}${3:um} right= ${4:n}${5:um} \\',
                '  front= ${6:n}${7:um} back= ${8:n}${9:um} [negative]',
            ],
        },
    },
    Photo: {
        Simple: {
            desc: 'Photoresist exposure',
            lines: [
                'photo mask= ${1:mask_name} thickness= ${2:n}${3:um}',
            ],
        },
    },
    MeshGoals: {
        Simple: {
            desc: 'Mesh goals and grid settings',
            lines: [
                'mgoals accuracy= ${1:n}${2:um}',
                'grid set.min.normal.size= ${3:n}${4:um} \\',
                '  set.normal.growth.ratio.2d= ${5:n}',
                '  # set.normal.growth.ratio.3d= ${6:n}',
            ],
        },
    },
    RefineBox: {
        Simple: {
            desc: 'Simple refinement box',
            lines: [
                'refinebox name= ${1:name} ${2:material} min= {${3:xmin} ${4:ymin}} max= {${5:xmax} ${6:ymax}} \\',
                '  xrefine= {${7:x1} ${8:x2} ${9:x3}} yrefine= {${10:y1} ${11:y2} ${12:y3}}',
            ],
        },
        Interface: {
            desc: 'Interface refinement box',
            lines: [
                'refinebox name= ${1:name} interface.materials= {${2:material1} ${3:material2} ...} \\',
                '  min.normal.size= ${4:n}${5:um} normal.growth.ratio= ${6:n}',
            ],
        },
        'Interface-pairs': {
            desc: 'Interface-pairs refinement box',
            lines: [
                'refinebox name= ${1:name} interface.mat.pairs= {${2:pair1_mat1} ${3:pair1_mat2} ${4:pair2_mat1} ${5:pair2_mat2} ...} \\',
                '  min.normal.size= ${6:n}${7:um} normal.growth.ratio= ${8:n}',
            ],
        },
        Mask: {
            desc: 'Mask-based refinement box',
            lines: [
                'refinebox name= ${1:name} mask= ${2:maskname} \\',
                '  xrefine= {${3:x1} ${4:x2} ${5:x3}} yrefine= {${6:y1} ${7:y2} ${8:y3}} \\',
                '  extrusion.min= ${9:xmin} extrusion.max= ${10:xmax} extend= ${11:n}',
            ],
        },
    },
    Struct: {
        Tdr: {
            desc: 'Write TDR structure file',
            lines: [
                'struct tdr= ${1:filename}',
            ],
        },
        Bnd: {
            desc: 'Write boundary file',
            lines: [
                'struct tdr.bnd= ${1:filename}',
            ],
        },
    },
};
