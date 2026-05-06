# Sentaurus™ Visual User Guide

Version T-2022.03, March 2022

# Copyright and Proprietary Information Notice

$\circledcirc$ 2022 Synopsys, Inc. This Synopsys software and all associated documentation are proprietary to Synopsys, Inc. and may only be used pursuant to the terms and conditions of a written license agreement with Synopsys, Inc. All other use, reproduction, modification, or distribution of the Synopsys software or the associated documentation is strictly prohibited.

# Destination Control Statement

All technical data contained in this publication is subject to the export control laws of the United States of America. Disclosure to nationals of other countries contrary to United States law is prohibited. It is the reader’s responsibility to determine the applicable regulations and to comply with them.

# Disclaimer

SYNOPSYS, INC., AND ITS LICENSORS MAKE NO WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, WITH REGARD TO THIS MATERIAL, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.

# Trademarks

Synopsys and certain Synopsys product names are trademarks of Synopsys, as set forth at https://www.synopsys.com/company/legal/trademarks-brands.html.

All other product or company names may be trademarks of their respective owners.

# Free and Open-Source Licensing Notices

If applicable, Free and Open-Source Software (FOSS) licensing notices are available in the product installation.

# Third-Party Links

Any links to third-party websites included in this document are for your convenience only. Synopsys does not endorse and is not responsible for such websites and their practices, including privacy practices, availability, and content.

www.synopsys.com

# Contents

Conventions. . 20

Customer Support . 20

# 1. Introduction to Sentaurus Visual . 22

Functionality of Sentaurus Visual. . 22

Starting Sentaurus Visual 22

From the Command Line . . 22

From Sentaurus Workbench 24

As a D-Bus Session . . 24

Accelerating the Rendering of Graphics . . . 25

TCAD Sentaurus Tutorial: Simulation Projects . . 25

User Interface of Sentaurus Visual 26

Menu Bar . . 27

Toolbars . 27

Plot Area. . 28

Tcl or Python Console 28

Data Selection and Properties Panels . . . 29

Quick Access to Tabs of Plot Properties and Axis Properties Panels 29

Filtering Names on the Data Selection Panel. . . 30

Interface to Sentaurus Process and Sentaurus Interconnect 32

Setting Up the Interface . . 35

Loading Command Files . 37

Inserting and Deleting Breakpoints in the Flow . . . 37

Inserting and Deleting Checkpoints in the Flow . . . 38

Indicating Status of Steps . 39

Updating the Structure . . 39

Multithreading Support. . 39

# 2. Basic Operations . 41

Loading Files . 41

Supported File Formats . 41

Loading Scripts . . 42

Reloading Plot Files . . . 43

Automatically Reloading Datasets . . 43

Managing Loaded Information . . 45

Customizing Settings . . . 46

Creating Custom Buttons to Access Scripts 47

Working With Plots. 48

Modes When Interacting With Plots . . 48

Common Modes. . 49

XY Plot–Only Modes 50

2D Plot–Only Modes 50

3D Plot–Only Modes 51

Linking Plots. . . 51

Automatically Linking Plots. . . 52

Undoing Operations . . 54

Displaying Multiple Plots . . 54

Grid Orientation . 54

Vertical Orientation . . 56

Horizontal Orientation. . 57

Managing Frames 58

Drawing Inside Plots 59

Inserting Text . . 59

Drawing Rectangles. . 59

Drawing Ellipses. . . 60

Drawing Lines 60

Exporting Plots. . 61

Exporting Movies . 62

Starting a New Movie. . 62

Adding Frames in a Movie . . 62

Exporting a Movie 63

Printing Plots . 64

Zooming and Panning . . 64

Zoom Tool 64

Reset Tool . 64

Deleting Plots. . 64

Performance Options. . 65

Fast Draw (3D Plots Only) . . . 65

Subsampling (2D and 3D Plots Only) . . 65

Advanced Options (XY Plots Only) . . . 65

Advanced Options (2D and 3D Plots Only) . . . 67

Selecting Log Files. . . 69

# 3. Working With XY Plots 71

Loading XY Plots . 71

Plotting One Curve. . . 72

Plotting Multiple Curves . . 73

Visualizing Multiple TDR States . . . 77

Cutline Plots. . 79

Curve Properties . 80

Modifying Properties in Multiple Curves. . . 81

Plot Area Properties . . . 82

Legend Properties . 83

Axis Properties. . 83

Changing the Axis Padding . . 84

Changing the Axis Precision 84

Duplicating XY Plots. . . 85

Using Symbols and Scientific Notation in Plots . . 85

Best Look Option . . 89

Plotting Edges of Depletion Regions . . . 89

Plotting Band Diagrams . . . 91

Visualizing Discrete Traps in Band Diagrams . . . 92

Visualizing Data as a Step-Like Plot . 93

Saving the Plot to a Tcl File . 93

Probing. . . . 94

Probe Options . . 94

Performing Complex Mathematical Operations on 1D Data . . 95

Performing Complex Mathematical Operations on Curves . . 96

Computing Electrical Characteristics . . 97

Exporting Data From Variables and Curves. . . . 97

# 4. Working With 2D and 3D Plots . 100

Visualizing 2D and 3D Plots. . 100

Changing Plot Properties . . . 101

Changing the Color Scheme for Materials . . 103

Displaying Region or Material Names . 106

Visualizing Fields . . 107

Visualizing Fields Defined on Interface Regions . . 108

Visualizing Automatically Generated Regions . . 110

Junction Lines 110

Depletion Regions . . 110

Visualizing Multiple TDR States . . . 111

Visualizing Regions With Multiple Parts. . . 115

Visualizing Discrete Traps . . 117

3D View . . 119

Interacting With 3D Plots . . 121

Editing Camera Properties . . . 122

2D View . 123

Interacting With 2D Plots . . 123

Light Kit . 124

Editing the Properties of Lights 126

Loading Options for Data. 127

Rendering Options. 129

Materials and Regions . . 130

Showing or Hiding Properties for Multiple Materials and Regions . . 130

Modifying Properties in Multiple Materials and Regions. . . 131

Modifying the List of Initially Hidden Materials . . 132

Contact Regions. . 133

Contour Plots . . 136

Contour Legend Settings . . . 136

Displaying Contour Plots . 138

Converting Data to Nodal. . 138

Creating New Scalar Fields . . 139

Vector Plots . 140

Importing an Image as a Background Field . 141

Adjusting Magnification of an Image . . 142

Visualizing Point Boundary Conditions 144

Scaling and Shifting 2D and 3D Geometries . 144

Rotating Structures (3D Plots Only). . 145

Rotation Point. . 146

Customizing the Rotation Point . . 147

Using the Rotation Point as a Reference Point . . 147

Rotating Plots Using Exact Values. . . 148

Overlaying Plots. . 150

Showing Differences Between Plots 152

Measuring Distances . 153

Integration Tool 155

Using a Custom Integration Domain . . 157

Integrating Only a Defined Set of Regions or Materials . . . . 157

Probing. . . 157

Accessing Dataset Information 161

Maximum and Minimum Locations of Fields . 162

Changing Properties of Markers . . 165

Value Blanking . . . 166

Choosing Constraints. . 167

Options for Value Blanking. . . 169

Visualizing Deformation of Structures . 171

Cutting Structures 172

Generating Precise Cutlines and Cutplanes . . 173

Cutlines in 2D Plots . 176

Manipulating Cutlines. . 177

Polyline Cuts in 2D Plots . . 177

Manipulating the Polyline . . 179

Cutting Along Boundaries. . . 179

Step 1: Selecting Regions or Materials 180

Step 2: Adding Vertex Points . . 181

Step 3: Choosing Segment Regions . . 182

Surface Cutlines From 3D Plots. . . 184

Changing Properties of Cutline Along Boundaries. . . 186

Two-Dimensional Projections. . 186

Cutplanes in 3D Plots. . 190

Extracting the Path of Minimum or Maximum Values of a Scalar Field . . 191

Surface Plots . 197

Creating Surface Plots . . 198

Isosurfaces and Isolines 199

Creating Iso-Geometries . . 199

Modifying Iso-Geometries 201

Streamlines 202

Displaying Streamlines. . . 203

Position Tab . 203

Specifying Regions or Materials. . . 204

Representing the Streamlines . 204

Integration Settings 204

Integration Tab . 205

Managing Created Streamlines . . 205

Configuring General Parameters of Streamlines . . . 205

Extracting Data From Streamlines . . . 206

5. Automated Tasks . 209

Running Tcl or Python Scripts . 209

Example: Plot Id–Vg Curve . . 209

Example: Create Cutline and Export Cutline Data to CSV File for Further Processing . . 211

Saving Command History 211

Running Inspect Command Files. . . 211

Script Library . . . 211

Restrictions 212

A. Tcl Commands . 213

Syntax Conventions. 213

Object Names: -name Argument . 213

Common Properties. . 214

Colors. . 214

Fonts . 215

Lines. . 216

Markers 216

add_custom_button . 217

add_frame . 218

calculate. 219

calculate_field_value . 220

calculate_scalar . . 221

create_curve 222

create_cut_boundary . 223

create_cutline. . 224

create_cutplane . 226

create_cutpolyline 227

create_cutpolyplanes. . 228

create_field 229

create_iso 230

create_plot . 231

create_projection . . 232

create_projection_path 234

create_ruler . . 236

create_streamline 237

create_surface . 239

create_variable 240

diff_plots. . 241

draw_ellipse. . 242

draw_line . 243

draw_rectangle 244

draw_textbox . . 245

echo . 246

exit . 246

export_curves 247

export_movie . . 248

export_settings. . . 249

export_variables. . 249

export_view . 250

extract_path . 251

extract_streamlines 253

extract_value . 254

find_values. . . 256

get_axis_prop 257

get_camera_prop. . 260

get_contour_labels_prop . . . 261

get_curve_data 263

get_curve_prop 264

get_cutline_prop 266

get_cutplane_prop . . 268

get_ellipse_prop. . 269

get_field_prop 270

get_grid_prop. . . 272

get_input_data . . 273

get_legend_prop 274

get_line_prop . . . 276

get_material_prop . 277

get_plot_prop . . . 279

get_rectangle_prop . 282

get_region_prop. . . 283

get_ruler_prop . . 285

get_streamline_prop 286

get_textbox_prop . . 288

get_variable_data 290

get_vector_prop. . 291

get_vertical_lines_prop 293

help . 294

import_settings. . . 295

integrate_field 296

link_plots . 298

list_curves 300

list_custom_buttons . 301

list_cutlines 302

list_cutplanes . . 303

list_datasets . . 304

list_ellipses. . . 305

list_fields 306

list_files . 307

list_lines . . 308

list_materials 309

list_movie_frames . . 310

list_plots . 310

list_rectangles 311

list_regions. . 312

list_streamlines 313

list_tdr_states. . 314

list_textboxes . . 315

list_variables 316

list_vertical_lines . 317

load_file . 318

load_file_datasets . 319

load_library . . 320

load_script_file . . 321

move_plot 322

overlay_plots . 323

probe_curve. . 324

probe_field . . . 325

reload_datasets . 326

reload_files. . 326

remove_curves 327

remove_custom_buttons . . 327

remove_cutlines. . 328

remove_cutplanes . 328

remove_datasets . 329

remove_ellipses. . . 329

remove_lines . 330

remove_plots . 331

remove_rectangles 331

remove_rulers 332

remove_streamlines. . 333

remove_textboxes . 334

render_mode . . 335

reset_settings. . . 335

rotate_plot . 336

save_plot_to_script . 337

select_plots 338

set_axis_prop. . . 339

set_band_diagram . . 343

set_best_look. 343

set_camera_prop. . 344

set_contour_labels_prop . . 345

set_curve_prop 347

set_cutline_prop. . . 349

set_cutplane_prop . . 350

set_deformation . . 351

set_ellipse_prop. . 352

set_field_prop 353

set_grid_prop. . 355

set_legend_prop 356

set_line_prop . . 359

set_material_prop 360

set_plot_prop . . . 362

set_rectangle_prop 366

set_region_prop. . 367

set_ruler_prop . . 369

set_streamline_prop 370   
set_tag_prop . 372   
set_textbox_prop . . 373   
set_transformation . 375   
set_value_blanking 376   
set_vector_prop . . 377   
set_vertical_lines_prop 379   
set_window_full . 380   
set_window_size 380   
show_msg . 381   
start_movie 382   
stop_movie. . 382   
undo. 383   
unload_file . 383   
version . 384   
windows_style 385   
zoom_plot 386

# B. Python Commands 387

General Information . 387   
Accessing Documentation for Python Commands. . 387   
Syntax Conventions. 387   
Get Property Commands . . 388   
Set Property Commands . . 388   
Common Properties. 388   
Colors. . 388   
Fonts 390   
Lines. . 390   
Markers . 391

# C. Menus and Toolbars of User Interface. 392

Menus 392

File Menu . . 392

Edit Menu . . 393

View Menu . . 393

Tools Menu. . 395

Data Menu . 397

Window Menu 398

Help Menu . . . 399

Toolbars . 400

File Toolbar. . 400

Edit Toolbar . 400

Draw Toolbar . 400

View Toolbar. . . 401

Tools Toolbar . 401

Movies Toolbar . . 402

Look Toolbar. . 402

Additional Keyboard Shortcuts (2D and 3D Plots). . . . 403

D. Available Formulas 405

Creating a New Variable 405

Creating a New Curve . . 405

Applying Functions to a Curve. 406

Creating a New Field . 407

Available Functions 407

E. Inspect Support in Sentaurus Visual . 413

Fully Supported Commands 413

Partially Supported Commands . 414

Not Supported Commands 415

Script Library Support 415

Extraction Library . . . 415

Curve Comparison Library . . . 415

The extend Library . . . 416

F. Extraction Library 417

Syntax Conventions. 417

Help for Procedures. . 419   
Output of Procedures. . 419   
ext::AbsList . 421  
ext::DiffForwardList . 422  
ext::DiffList . 423  
ext::ExtractBVi . 424   
ext::ExtractBVv 425   
ext::ExtractEarlyV 427  
ext::ExtractExtremum. . 428   
ext::ExtractGm . . 429  
ext::ExtractIoff 431  
ext::ExtractRdiff . 433  
ext::ExtractRsh. . 435   
ext::ExtractSS 437  
ext::ExtractSsub. . 439  
ext::ExtractValue 440  
ext::ExtractVdlin . 442  
ext::ExtractVdlog 443   
ext::ExtractVglin . . . 444   
ext::ExtractVglog . 446  
ext::ExtractVtgm. . 447  
ext::ExtractVti. 448  
ext::ExtractVtsat. . 450  
ext::FilterTable 451  
ext::FindExtrema . 455  
ext::FindVals 456  
ext::LinFit . 458  
ext::Linspace . 460  
ext::LinTransList. 461  
ext::Log10List. . 462   
ext::RemoveDuplicates 463

ext::RemoveZeros . . 464   
ext::SubLists 465  
lib::SetInfoDef 467   
References. . 467

# G. Impedance Field Method Data Postprocessing Library. . . 468

Overview 468   
Syntax Conventions. . 469   
Help for Procedures. . 470   
Output of Procedures. . 471   
ifm::Gauss . 472   
ifm::GetDataQuantiles . 473   
ifm::GetGaussian . 474   
ifm::GetHistogram . . 476   
ifm::GetMoments . 477   
ifm::GetMOSIVs . 478   
ifm::GetMOSWeights . . 483   
ifm::GetNoiseStdDev . 484   
ifm::GetQQ. 486   
ifm::GetsIFMStdDev. . 487  
ifm::GetSNM 488   
ifm::GetSRAMVTC. 490   
ifm::ReadCSV 494   
ifm::ReadsIFM . 495  
ifm::WriteCSV 498   
lib::SetInfoDef 499

# H. Two-Port Network RF Extraction Library. . . 500

Syntax Conventions. 501

Help for Procedures. . 503

Output of Procedures. . . 503

Overview of RF Extraction Library Procedures . . . 503

Equations Used in RF Extraction Library. . . . 506

A-Matrix, C-Matrix, and Y-Matrix . . . 506   
Tcl Arrays rfx::AC and rfx::Y . 507

Power Spectral Density Matrices . . 507

Power Spectral Densities . . 508   
PSDs Computed by Sentaurus Device and RF Extraction Library. . 510   
Power Spectral Density Tcl Arrays . . . 511

Device Width Scaling for 2D Structures . . . 512

Matrix Conversions 513

Converting Y-Matrix to h-Matrix . . 513   
Converting Y-Matrix to S-Matrix . . 513   
Converting Y-Matrix to Z-Matrix . . 514

Gains, Amplifier Stability, and Unilateralization . . 514

Small-Signal Current Gain . . 514   
Amplifier Stability . . . 514   
Maximum Stable Gain and Maximum Available Gain . . 515   
Unilateral Amplifier Design . . . 515

Converting Gain Units to Decibels . . 515

Transistor Figures of Merit . . 516

ft and fmax . . 516   
Extraction Methods for ft and fmax. . . 517   
Cutoff Frequency for Stability . . . 519

Noise Figure of a Linear Two-Port Network . . 519

rfx Namespace Variables . 523   
Characteristic Impedance and Source Impedance . 525

rfx::CreateDataset 526   
rfx::Export. . 531   
rfx::GetFK1. 532   
rfx::GetFmax 534   
rfx::GetFt 536   
rfx::GetNearestIndex 538   
rfx::GetNoiseFigure . 540   
rfx::GetParsAtPoint 543   
rfx::GetPowerGain . 544   
rfx::Load . . 547   
rfx::NoiseFigure . . 549

rfx::PolarBackdrop . . . 551

rfx::PowerGain . 552

rfx::RFCList 553

rfx::SmithBackdrop. . . 555

rfx::Y2H 556

rfx::Y2S 557

rfx::Y2Z 558

Complex Arithmetic Support 559

rfx::Abs_c . . 560

rfx::Abs_v . . . 561

rfx::Abs2_c . . 562

rfx::Abs2_v . . 562

rfx::Add_c . . . 563

rfx::Add_v . . . 564

rfx::Cart2Polar_c . . 565

rfx::Cart2Polar_v 565

rfx::Conj_c . . 566

rfx::Conj_v . 567

rfx::Div_c . 568

rfx::Div_v . 568

rfx::Im_c . . 569

rfx::Mul_c . . 570

rfx::Mul_v . . 570

rfx::Mulsc_c . . 571

rfx::Phase_c . . 572

rfx::Phase_v . . . 573

rfx::Polar2Cart_c . 574

rfx::Polar2Cart_v . . 574

rfx::Re_c. . . 575

rfx::Sign . . . 576

rfx::Sub_c . . 577

rfx::Sub_v . . . 577

lib::SetInfoDef 579

References. 579

I. PhysicalConstants Library . 581

Major Physical Constants 581

References. . 583

# About This Guide

The Synopsys® Sentaurus™ Visual tool is part of Sentaurus Workbench Visualization. It is a plotting software for visualizing data from simulations and experiments. Sentaurus Visual enables users to work interactively with data using both a user interface and a scripting language for automated tasks.

For additional information, see:

• The TCAD Sentaurus release notes, available on the Synopsys SolvNetPlus support site (see Accessing SolvNetPlus on page 21)   
• Documentation available on the SolvNetPlus support site

# Conventions

The following conventions are used in Synopsys documentation.   

<table><tr><td>Convention</td><td>Description</td></tr><tr><td>Bold text</td><td>Identifies a selectable icon, button, menu, or tab. It also indicates the name of a field or an option.</td></tr><tr><td>Courier font</td><td>Identifies text that is displayed on the screen or that the user must type. It identifies the names of files, directories, paths, parameters, keywords, and variables.</td></tr><tr><td>Italicized text</td><td>Used for emphasis, the titles of books and journals, and non-English words. It also identifies components of an equation or a formula, a placeholder, or an identifier.</td></tr><tr><td>Key+Key</td><td>Indicates keyboard actions, for example, Ctrl+I (press the I key while pressing the Control key).</td></tr><tr><td>Menu &gt; Command</td><td>Indicates a menu command, for example, File &gt; New (from the File menu, choose New).</td></tr></table>

# Customer Support

Customer support is available through the Synopsys SolvNetPlus support site and by contacting the Synopsys support center.

# Accessing SolvNetPlus

The SolvNetPlus support site includes an electronic knowledge base of technical articles and answers to frequently asked questions about Synopsys tools. The site also gives you access to a wide range of Synopsys online services, which include downloading software, viewing documentation, and entering a call to the Support Center.

To access the SolvNetPlus site:

1. Go to https://solvnetplus.synopsys.com.   
2. Enter your user name and password. (If you do not have a Synopsys user name and password, follow the instructions to register.)

# Contacting Synopsys Support

If you have problems, questions, or suggestions, you can contact Synopsys support in the following ways:

Go to the Synopsys Global Support Centers site on www.synopsys.com. There you can find email addresses and telephone numbers for Synopsys support centers throughout the world.   
Go to either the Synopsys SolvNetPlus site or the Synopsys Global Support Centers site and open a case (Synopsys user name and password required).

# Contacting Your Local TCAD Support Team Directly

Send an email message to:

• support-tcad-us@synopsys.com from within North America and South America   
• support-tcad-eu@synopsys.com from within Europe   
support-tcad-ap@synopsys.com from within Asia Pacific (China, Taiwan, Singapore, Malaysia, India, Australia)   
• support-tcad-kr@synopsys.com from Korea   
• support-tcad-jp@synopsys.com from Japan

#

# 1Introduction to Sentaurus Visual

This chapter presents basic information about Sentaurus Visual.

# Functionality of Sentaurus Visual

Sentaurus Visual allows you to visualize complex simulation results generated by physical simulation tools in one, two and three dimensions. You can visualize data for an initial understanding and analysis, and then modify the plots to gain a new perspective.

Sentaurus Visual can be used to create plots that display fields, geometries, and regions, including results such as p-n junctions and depletion layers. It also allows you to view I–V curves and doping profiles, and provides tools to zoom, pan, and rotate images. You also can extract data using measure and probe tools.

The user interface provides direct and easy-to-use functionality, as well as advanced controls for expert users. With the user interface of Sentaurus Visual, you can systematically visualize devices as xy, 2D, and 3D plots.

# Starting Sentaurus Visual

Sentaurus Visual can be started either from the command line or from Sentaurus Workbench.

# From the Command Line

To start Sentaurus Visual from the command line, enter:

svisual

The following example loads the dataset associated with a file and generates its plot:

svisual n2_fps.tdr

When starting Sentaurus Visual from the command line, you can use the following options (which are displayed by entering svisual -h):

Usage: svisual [options] [FILES]

Description:

Sentaurus Visual is a tool to display and analyze structures and curves.

Options:

-h[elp] : Display this help message.

-v[ersion] : Print the Sentaurus Visual version.

-m[esa] : Run Sentaurus Visual with Mesa driver.

-glx : Run Sentaurus Visual with GLX driver.

-vgl : Run Sentaurus Visual in VirtualGL environment.

-noavx : Run Sentaurus Visual without AVX support (by default, AVX support is active when Mesa is switched on).

-b[atch] : Run in pure batch mode (requires a script file).

-batchx | -bx : Run in batch mode that allows export of graphics (virtual X server, requires a script file).

-retry_count <integer> : Number of attempts to find a free virtual X screen buffer. Specify 0 to retry indefinitely.

-retry_time <integer> : The maximum time to wait (in seconds) for a free virtual X screen buffer to become available.

-diagnostics : Execute the diagnostics process, analyzing the environment, the system, and the setup.

-p[ython] : Run Sentaurus Visual in Python mode, overriding user preferences.

-t[cl] : Run Sentaurus Visual in Tcl mode, overriding user preferences.

-s[cript] <string> : Execute listed files as Sentaurus Visual scripts in Tcl or Python mode, according to user preferences, or -t[cl] or -p[ython] option.

-i[nspect] | -f <string> : Execute listed files as Inspect scripts.

-librarypath <string> : Add library path to default path.

-nolibrary : Switch off Tcl library auto-loading.

-nowait : Do not wait for a license to become available.

-verbose : Print every Tcl or Python command executed to the log file.

-slowscript | -ss : Redraw plots automatically after each command (script execution is slower).

-spi : Launch Sentaurus Process interface.

-geoms <string> : Load only the geometries listed.

-alldata : Load all data from a file, overriding user preferences.

# Chapter 1: Introduction to Sentaurus Visual Starting Sentaurus Visual

--threads <integer>

: Number of threads to use, overriding user preferences. Specify 0 to yield automatic detection.

--max_threads <integer>

: Maximum number of threads to use, overriding --threads option and user preferences if they are higher. Specify 0 to yield automatic detection.

# Note:

Sentaurus Visual can run solely in batch mode, that is, no display is required and scripts can be run using a shell. This mode is fast but has some disadvantages, for example, exporting graphics only works in the GUI mode. To overcome this, use the -batchx option.

# From Sentaurus Workbench

Sentaurus Visual is integrated in Sentaurus Workbench. You can start Sentaurus Visual in one of the following ways:

Click a node, which displays the Node Explorer. In the Node Explorer, in the Viewer box, select svisual and click the Launch button next to it.   
• Click the Visualize toolbar button and select Sentaurus Visual.

Sentaurus Visual can receive node data and can be inserted into tool flows.

# Note:

Sentaurus Visual can run in batch mode (-b option), which is especially useful when used within tool flows. In this context, the use of macro files is also of interest (see Chapter 5 on page 209).

# As a D-Bus Session

Sentaurus Visual can be run in a special mode in which it creates its own D-Bus session. This feature is useful, for example, for certain grid configurations that cannot close D-Bus sessions, even if Sentaurus Visual has already exited.

To switch on this feature, set the SVISUAL_DBUS_RUN_SESSION environment variable to 1 before starting Sentaurus Visual as follows:

# For C shell setenv SVISUAL_DBUS_RUN_SESSION 1

# For bash export SVISUAL_DBUS_RUN_SESSION=1

# Accelerating the Rendering of Graphics

In Sentaurus Visual, 2D and 3D plots are rendered using OpenGL® acceleration, which can produce significant differences in performance depending on the configuration of the machine where Sentaurus Visual runs.

By default, Sentaurus Visual always runs in the best supported graphics mode it can find, using the graphics card of the machine to render plots. If Sentaurus Visual cannot detect a graphics card, then it searches for a valid VirtualGL environment and uses it if available. If there are no compliant renderers, then Sentaurus Visual reverts to a generic Mesa driver for graphics rendering.

If your machine has a graphics card or VirtualGL environment but Sentaurus Visual runs with Mesa rendering, then you can force Sentaurus Visual to run with a GLX driver by using the -glx option or to run in a VirtualGL environment by using the -vgl option. If Sentaurus Visual cannot find a GLX driver or a valid VirtualGL environment, it exits with an error message. To force Mesa rendering, specify the -mesa option.

When using Mesa rendering, Sentaurus Visual automatically detects whether it can utilize Advanced Vector Extensions (AVX) instructions to speed up visualization. AVX significantly increases rendering performance when using a Mesa driver. To force Mesa rendering without the use of AVX, specify the -noavx option.

# Note:

You cannot use both the -glx and -mesa options simultaneously.

# TCAD Sentaurus Tutorial: Simulation Projects

The TCAD Sentaurus Tutorial provides various projects demonstrating the capabilities of Sentaurus Visual.

To access the TCAD Sentaurus Tutorial:

1. Open Sentaurus Workbench by entering the following on the command line: swb   
2. From the menu bar of Sentaurus Workbench, choose Help $>$ Training or click on the toolbar.

Alternatively, to access the TCAD Sentaurus Tutorial:

1. Go to the $STROOT/tcad/current/Sentaurus_Training directory.

The STROOT environment variable indicates where the Synopsys TCAD distribution has been installed.

2. Open the index.html file in your browser.

# User Interface of Sentaurus Visual

The user interface of Sentaurus Visual has different areas (see Figure 1).

The Data Selection panel and properties panel are located to the left of the main window, the plot area displays the different visualizations, the Tcl or Python Console is in the lower part, and the toolbars are located on the sides of the main window.

For detailed information about menus and toolbars, see Appendix C on page 392.

# Note:

You can customize the user interface of Sentaurus Visual. Different options are available, for example, you can detach the panels, adjust their size, and move the toolbars to another part of the main window.

![](images/78c5b9dc748ddaac1085fbfa9e8c4d687ffcfb534dce0d1cd86550476d40efeb.jpg)  
Figure 1 Main window of Sentaurus Visual showing different plots in the plot area

# Menu Bar

You use the menu bar to access the main operations of Sentaurus Visual such as opening files, showing and hiding toolbars, configuring Sentaurus Visual, manipulating loaded data, and organizing plots in the plot area.

Table 1 Menus available from user interface   

<table><tr><td>Menu</td><td>Description</td></tr><tr><td>File</td><td>Loads plots and scripts, reloads data, and exports and prints plots.</td></tr><tr><td>Edit</td><td>Selects plots, and selects settings for Sentaurus Visual.</td></tr><tr><td>View</td><td>Shows and hides toolbars and panels; plot settings and performance options.</td></tr><tr><td>Tools</td><td>Accesses analysis tools.</td></tr><tr><td>Data</td><td>Views loaded datasets, and deletes selected plots.</td></tr><tr><td>Window</td><td>Organizes and manages active plots.</td></tr><tr><td>Help</td><td>Provides information about Sentaurus Visual.</td></tr></table>

# Toolbars

Toolbars offer quick access to commonly used functions that are also available from the different menus (see Toolbars on page 400).

# Note:

One toolbar is always visible to allow you to show or hide the Tcl or Python Console and to organize the data selection and properties panels into tabs.

Table 2 Toolbars   

<table><tr><td>Toolbar</td><td>Description</td></tr><tr><td>File</td><td>Loads plots and scripts, reloads data, and exports and prints plots.</td></tr><tr><td>Edit</td><td>Undoes operations, and displays toolbar for drawing shapes and inserting text onto plots.</td></tr><tr><td>View</td><td>Accesses zoom operations and subsampling.</td></tr><tr><td>Tools</td><td>Accesses analysis tools.</td></tr><tr><td>Custom Buttons</td><td>Accesses custom buttons. See Creating Custom Buttons to Access Scripts on page 47.</td></tr><tr><td>Movies</td><td>Records animated images.</td></tr><tr><td>Look</td><td>Shows or hides panels.</td></tr></table>

# Plot Area

The plot area displays the active plots. You can select or deselect plots as follows:

• To select one plot, click inside the plot.   
• To select multiple plots, hold the Shift key while you click inside the plots.   
• If you click a selected plot while holding the Shift key, then that plot is deselected.

Toolbars and panels change depending on the types of plot selected.

# Tcl or Python Console

The Tcl or Python Console shows information about the commands used to manipulate and display data in Sentaurus Visual. The Console has different areas:

The main pane allows you to input the available commands from the respective interpreter, to output the command results, and to register the history of every action performed in the Sentaurus Visual GUI since the session started.   
You can enter commands manually at the command prompt. This is helpful when running complex calculations on datasets and displaying results.   
On the right side, click Clear to delete the command history from the main pane, and click Save to store everything that was executed into a script file, so that it can be run without repeating all the operations.

For details about Tcl commands and scripting, see Chapter 5 on page 209 and Appendix A on page 213.

For details about Python commands, see Appendix B on page 387.

# Note:

The Python mode is activated when starting Sentaurus Visual with the $^ - \mathbf { p }$ or -python command-line option.

# Data Selection and Properties Panels

Two panels are located by default at the left side of the main window:

The Data Selection panel displays the data to visualize and shows which data is already displayed. This panel differs for xy plots, and 2D and 3D plots. The differences are explained in Chapter 3 on page 71 and Chapter 4 on page 100.   
The Properties panel lists the selected object properties. By default, it shows the plot properties. It will change after an object is selected. This panel can also be displayed (if it is arranged behind the Data Selection panel or if it is hidden) at its last position in the main window if you double-click the object.

If the plot area is empty (no plots are created or all plots are hidden), then these panels are always hidden. After a plot is created, by default, both panels open even if both were closed by the user in the last session.

To change this default behavior:

1. Choose Edit $>$ Preferences.

The User Preferences dialog box is displayed.

2. Expand Application $>$ Common.   
3. Under Force Panels to Show, deselect Data Selection Panel or Properties Panel or both options.   
4. Click Save.

# Quick Access to Tabs of Plot Properties and Axis Properties Panels Note:

The quick access operation for axes applies to xy and 2D plots only.

The Plot Properties panel or the Axis Properties panel must be already open for these quick access operations to work. To open the Plot Properties panel, double-click an empty part of the plot if another panel is active. To open the Axis Properties panel, double-click any axis in the plot area.

You can quickly access different tabs of the Plot Properties panel or the Axis Properties panel by clicking particular parts of a plot in the plot area:

• Click the plot title to display the Main tab of the Plot Properties panel.   
Click an axis title (for example, X) to display the Title/Scale tab of the Axis Properties panel.

# Chapter 1: Introduction to Sentaurus Visual User Interface of Sentaurus Visual

Click any tick label on an axis (for example, -5) to display the Ticks tab of the Axis Properties panel. This operation applies only to 2D plots.   
• Click an axis line to display the Main tab of the Axis Properties panel.

# Filtering Names on the Data Selection Panel

You can filter the visible names of the Data Selection panel and xy plot data selection. This works for all data selection items, such as materials, region, lines/particles, or fields such as scalars or vectors.

The filter box opens when you start typing with the focus on the Data Selection panel. It automatically filters the view of the selection based on the filter expression. It supports case sensitivity, wildcards, and regular expression filtering.

The filter box is available in the Data Selection panel for the selection of rendering options for materials, regions, fields, and so on. It is also available for the data selection of xy plots.

The filter box contains the following buttons:

Click the $A :$ button to activate case sensitive filtering.   
Click the button to activate regular expression filtering. When it is deactivated, wildcard filtering is used.   
• Click the $\mathfrak { o }$ button to clear the filter expression.

You can use wildcard or regular expression filtering. Pressing the Esc key clears any active filter and shows all items again; any selected items remain selected. Pressing the Esc key again clears the selection.

# Wildcard Filtering

Wildcard filtering is based on command shell filtering to filter files. Wildcard filtering is simpler than full regular expression filtering. Wildcard filtering is selected when the regular expression button $( . ^ { \star } )$ button is deselected.

<table><tr><td>Syntax</td><td>Description</td></tr><tr><td>c</td><td>Any character represents itself apart from those mentioned in the following table entries. Therefore, c matches the character c.</td></tr><tr><td></td><td>Note:</td></tr><tr><td></td><td>If the character c appears at the start of the filter expression, then the regular expression only matches from the start.</td></tr><tr><td>?</td><td>Matches any single character. It is the same as . in full regular expressions.</td></tr><tr><td>*</td><td>Matches zero or more characters, of any character. It is the same as . * in full regular expressions.</td></tr><tr><td>[ . . . ]</td><td>Sets of characters can be represented in brackets, similar to full regular expressions. Within the character class, the backslash has no special meaning.</td></tr></table>

# Regular Expression Filtering

For most use cases, wildcard filtering should be sufficient. However, if you want more control, then you can use regular expressions. The regular expression is modeled on the Perl regexp language. Regular expressions are built from expressions, quantifiers, and assertions.

The simplest expression is a character, for example, x or 5. An expression can also be a set of characters enclosed in brackets. For example, [ABCD] will match an A, or a B, or a C, or a D. You can write this same expression as [A-D], and an expression to match any capital letter in the English alphabet is written as [A-Z].

You use the vertical bar (|), which means or, to include multiple words for matching. For example, you might want to find all fields containing the words band gap. You enclose the expression in parentheses (band|gap) to group expressions together, and they identify a part of the regular expression that you want to capture. Enclosing the expression in parentheses allows you to use it as a component in more complex regular expressions.

# Note:

A filter expression starting with a character c, which is not part of the syntax, results in the regular expression only matching from the start. This has been done to allow for a more intuitive search experience, but it differs from standard regular expression filtering.

A quantifier specifies the number of occurrences of an expression that must be matched. For example:

• $\mathbf { x } \{ 1 , 1 \}$ means match one and only one x.   
$\mathbf { x } \{ 1 , 5 \}$ means match a sequence of $_ \textrm { x }$ characters that contains at least one $_ \textrm { x }$ but no more than five.

Suppose you want a regular expression to match integers in the range from 0 to 99. At least one digit is required, so you start with the expression $\left[ 0 - 9 \right] \left\{ 1 , 1 \right\}$ , which matches a single digit exactly once.

With regard to assertions, when $\$ 5$ is the last character of a regular expression, it means the regular expression must match to the end of the string.

# Chapter 1: Introduction to Sentaurus Visual

Interface to Sentaurus Process and Sentaurus Interconnect

For more information about regular expressions, see J. E. F. Friedl, Mastering Regular Expressions, Sebastopol, California: O’Reilly Media, 3rd ed., 2006.

![](images/c291522194ceb36814e3e11dfd0b35465cf2f227fbeb93a96fdce41c7715a07a.jpg)  
Figure 2 Data Selection panel showing filtered names

![](images/712122c7c7d394c4e25004e01c4c3512e1d79c1b419f9e780a65e532120c3060.jpg)

# Interface to Sentaurus Process and Sentaurus Interconnect

The interface to Sentaurus Process and Sentaurus Interconnect visualizes 1D, 2D, and 3D structures and data evolution while the simulation progresses. The interface is initiated and controlled from Sentaurus Visual, including control of the simulation.

# Chapter 1: Introduction to Sentaurus Visual

Interface to Sentaurus Process and Sentaurus Interconnect

![](images/6043796fce77b5b4bad8736efd8c8d3b25af53de6eb753d59996a4eeba8adc22.jpg)  
Figure 3 Interface to Sentaurus Process: upper part of Simulation Control panel shows command file and lower part of panel shows log file

# Chapter 1: Introduction to Sentaurus Visual

Interface to Sentaurus Process and Sentaurus Interconnect

![](images/0cec99b8f2277c1d823aad0593debec4af2dc85654f7cd710bedc18d48fd5024.jpg)  
Figure 4   
Interface to Sentaurus Interconnect: upper part of Simulation Control panel shows command file and lower part of panel shows log file

Table 3   
Buttons of Simulation Control panel   

<table><tr><td>Button</td><td>Description</td></tr><tr><td>▼</td><td>The Load button loads a command file.
When a command file is loaded, it is thereafter referred to as the flow.</td></tr><tr><td>▲</td><td>The Run button runs the flow.
This button either starts running the flow or continues execution after pausing the flow.
The simulation continues at the location of the cursor (line with a light-yellow background).</td></tr><tr><td>III</td><td>The Pause button pauses the running flow.
The pause occurs either when the currently executing step (command) is finished or, for a long-running step, when the current time step is completed.</td></tr><tr><td>■</td><td>The Reset button resets the running flow.
The running flow stops, the connection to the simulator is terminated, and you return to the start of the flow.</td></tr><tr><td>▲</td><td>The Run Step button runs the next step in the flow.
When you click this button, either a single step (command) is executed or a group of commands enclosed in braces is executed. You must repeatedly click this button to execute the next steps.</td></tr><tr><td>○</td><td>The Save button saves the flow.</td></tr><tr><td>图</td><td>The Save As button saves the flow under a new name.</td></tr><tr><td>○</td><td>The Undo button restores the previously saved simulation state.
This button is available only when Breakpoint Behavior is set as Breakpoint as Checkpoint or Breakpoint and Checkpoint in user preferences (see Setting Up the Interface).</td></tr></table>

# Setting Up the Interface

To set up and run the interface:

1. Launch Sentaurus Visual with the following command-line options:   
> svisual -spi &   
2. From the Sentaurus Visual GUI, choose Edit $>$ Preferences.   
The User Preferences dialog box opens.   
3. Expand Common $>$ Miscellaneous.   
4. Under Simulator, in the Command field, enter the tool binary as well as any command-line options required. For example:

sprocess -n

5. Under Simulator, from the Breakpoint Behavior list, select one of the following:

◦ Breakpoint Only: Pauses the flow execution at the required step.

# Chapter 1: Introduction to Sentaurus Visual

Interface to Sentaurus Process and Sentaurus Interconnect

◦ Breakpoint as Checkpoint: This is the same as Breakpoint Only, but as well as pausing the flow, it also saves the step result. This allows the Undo $\curvearrowleft$ button to reach the last stored checkpoint.   
◦ Breakpoint and Checkpoint: With this option, the Undo button functionality is separated from breakpoints. A first click creates a breakpoint without saving the step result, behaving like the Breakpoint Only option. A subsequent click transforms this step into a checkpoint, saving the step result but not stopping the flow execution.

![](images/f2f4c3e339a0bd06e1e740fae4787de31145a024e9e7de3d2084211f0592c6f8.jpg)

# 6. Click Save.

# Loading Command Files

To load a command file:

1. In the Simulation Control panel, click the Load button. The Load File dialog box opens.   
2. Select a command file.   
3. Click Open.

In addition, a command file can be loaded from the command line using:

svisual -spi <filename>

# Inserting and Deleting Breakpoints in the Flow

To set breakpoints to pause the simulation at a particular step in the flow:

1. Click in the left margin of the line corresponding to the step (command) where you want the flow to stop.

A red circle indicates the location of the breakpoint (see Figure 5 on page 38).

2. Click the Run button to execute the entire flow, or click the Run Step button to execute individual steps.

# Note:

You can set multiple breakpoints in a flow.

Step results are saved if Breakpoint as Checkpoint is selected as the breakpoint behavior in user preferences (see Setting Up the Interface on page 35).

To delete a breakpoint:

► Click the red circle in the left margin until the circle disappears.

![](images/5160c841258ea434a5d117db723ec6d71aa56296d2e8e9cd7dd00e19c2b27da0.jpg)  
Figure 5   
Simulation Control panel showing (left)Sentaurus Process command file and (right) Sentaurus Interconnect command file with breakpoints and checkpoints

# Inserting and Deleting Checkpoints in the Flow

To set checkpoints to save the simulation state at a particular step in the flow (only if Breakpoint Behavior is set to Breakpoint and Checkpoint):

1. Click in the left margin once, at the line corresponding to the step (command) where you want the flow to save the step result.

A red circle indicates the location of the breakpoint (see Figure 5).

2. Click again over the same margin.

A blue circle indicates the location of the checkpoint (see Figure 5).

3. Click the Run button to execute the entire flow, or click the Run Step button to execute individual steps.

Note:

You can set multiple checkpoints in a flow.

To delete a checkpoint:

► Click the blue circle in the left margin until the circle disappears.

# Indicating Status of Steps

In the Simulation Control panel, as the flow is executed, a green triangle in the left margin (at the same location as breakpoints) indicates the step to be executed next. A red triangle indicates the step that is currently being executed.

Already executed steps are indicated by a gray background. This part of the flow cannot be changed further.

In addition, wherever the cursor is placed in the flow, its position is indicated by highlighting the line with a light-yellow background.

# Updating the Structure

In 3D simulations, two plots are shown with the titles bulk and boundary (see Figure 3 and Figure 4). This is because, in 3D simulations, both the bulk and boundary are not always up to date. The plot with its title in bold indicates the last updated information.

For example, if the insert command is called in a 3D simulation, then the boundary is updated; however, by default, the mesh is not updated. After the insertion operation is completed, the title of the boundary plot is bold, and the title of the bulk plot is not bold.

# Multithreading Support

Sentaurus Visual provides multithreading capabilities for the following features to improve their performance:

• Loading new TDR format files   
Visualizing Sentaurus Topography 3D structures and Sentaurus Process Explorer structures   
• Field integration (see Integration Tool on page 155)   
• Value blanking (see Value Blanking on page 166)   
• Cutting structures (see Cutting Structures on page 172)   
• Projection (see Two-Dimensional Projections on page 186)   
• Streamlines (see Streamlines on page 202)

In addition, Sentaurus Visual provides multithreading support for some internal computations, improving the general performance of the application. Most of the features work on a region basis, which translates to better speedups when regions are similar in size or complexity.

# Chapter 1: Introduction to Sentaurus Visual Multithreading Support

You can configure the number of threads used by Sentaurus Visual in user preferences: expand Common $>$ Miscellaneous and, under Threads, specify the maximum number of threads (see Figure 137 on page 206). You can select Auto next to the Max Number field to let Sentaurus Visual compute the ideal number of threads to use or set a preferred value. This number is usually the number of available CPUs on the machine. You also can select a fixed number of threads to use.

For convenience, you can specify the command-line options --threads and --max_threads to control the number of threads used. Both options accept an integer value and can be specified when launching Sentaurus Visual:

--threads <integer>: The specified value overrides any setting specified in user preferences. This option is convenient when you want to use a different number of threads occasionally without modifying user preferences. Specifying 0 yields to automatic detection, which usually allocates one thread per available CPU on the machine.   
--max_threads <integer>: The specified value enforces an overall limit on either user preferences or --threads usage. In any case, the number of threads to run concurrently is constrained by the specified value. If you specify 0, then it does not limit user preferences or the --threads option.

# Note:

Sentaurus Visual might use more threads than specified for other internal functionalities. For example, the Mesa driver uses threads for each 2D and 3D plot. Nevertheless, the number of concurrent threads in execution is constrained by user preferences or the --threads or --max_threads option.

# 2

# 2Basic Operations

This chapter describes the basic operations that are common to all types of plot in Sentaurus Visual.

# Loading Files

You can load files from the user interface or the command line. For example:

svisual [file1.tdr file2.tdr ...]

To load a file from the user interface:

1. Choose File $>$ Open.   
2. In the dialog box that opens, browse to the file you want to open, or enter the file name in the File name field.   
3. Click Open.

An opened file consists of datasets. A dataset is a structure containing data that is plotted on xy, 2D, or 3D space. For example, a .plt, or .plx file can consist of one or more datasets, and .tdr files usually consist of only one dataset.

# Note:

To select multiple files, hold the Ctrl key when you click the required files to load.

# Supported File Formats

Sentaurus Visual supports the most commonly used file formats, including: .csv, .plt, .plx, .tdr, and .tif.

# Loading Scripts

Sentaurus Visual can load scripts from the command line. For example, you can simply enter svisual with the path of a Tcl (.tcl) or Python (.py) script, and Sentaurus Visual detects the script mode automatically and starts with that scripting language.

You can set a preferred scripting language in user preferences if you do not start Sentaurus Visual with the path of a script:

1. Choose Edit $>$ Preferences.

The User Preferences dialog box opens.

2. Expand Common $>$ Miscellaneous.   
3. Under Preferred Scripting Language, select the required language.

![](images/da576c14f96c0197865fd37d88a3182565004c90b36ab12a27ea1ae854038cc1.jpg)

# 4. Click Save.

# Note:

If you start Sentaurus Visual with the -t[cl] or -p[ython] command-line option, then this enforces the selection, ignoring the preferred scripting language selected in user preferences.

Tcl and Python scripts run native Sentaurus Visual commands, while Inspect scripts need the -inspect or -f option to run Inspect commands in compatibility mode.

Most Inspect commands are fully supported, although some commands have only partial support and some commands are not supported at all. For detailed information about support for Inspect libraries and commands, see Appendix E on page 413. For detailed information about Inspect commands, see the Inspect User Guide.

From the user interface, choose File $>$ Run Script. A dialog box is displayed where you can select the script to load. The scripts loaded using the user interface run native commands only.

# Reloading Plot Files

Sometimes, there are changes to the datasets from outside Sentaurus Visual. These changes can be shown without closing Sentaurus Visual.

To reload a specific dataset:

► Choose File $>$ Reload Selected or press Shift $+ \mathsf { F } 5$

To reload all datasets:

► Choose File $>$ Reload All or press the F5 key.

# Note:

Not all changes to a dataset can be reloaded. For example, if the original structure was two dimensional, the reloaded data is expected to belong to a 2D plot. If, after changes, the dataset now contains data for a 3D structure, Sentaurus Visual cannot reload this plot.

# Automatically Reloading Datasets

You can reload 1D datasets automatically periodically after a certain number of seconds.

To reload datasets automatically using user preferences (applies to all plots):

1. Choose Edit $>$ Preferences.

The User Preferences dialog box opens.

# Chapter 2: Basic Operations

# Reloading Plot Files

2. Expand 1D > Plot.   
3. Under Automatic Reload Dataset, select Enable.

![](images/051ef271fb946241771a159f159fcb16ee2fcd2c1264fed2792d9a83a0e270fc.jpg)

4. Specify the number of seconds.   
5. Click Save.

To reload datasets automatically from the File menu:

1. Choose File $>$ Automatic Reload Dataset.

The Automatic Reload Dataset dialog box opens.

2. Select Enable.

![](images/9f6a9aa9cbb3662051633ebbacdbac04a23693deb5fdefac87ccec41f0ce4694.jpg)

3. Specify the number of seconds between each reload.   
4. Select whether the reload applies to the current selected plots or all plots.   
5. Click OK.

# Managing Loaded Information

Sentaurus Visual provides a dialog box to manage the information loaded in the current session.

Choose Data $>$ View Info Loaded to display the Manage Loaded Data dialog box (see Figure 6) with all the data that is currently active and the option of removing plots and datasets.

To delete all xy plots:

1. In the Dimension pane, click XY.   
2. Under Datasets, click Remove.

To delete a plot:

1. In the Plots pane, click the plot to be deleted.   
2. Under Plots, click Remove.

# Chapter 2: Basic Operations

Customizing Settings

# Note:

Deleting a plot does not delete the datasets associated with it. However, deleting a dataset removes the associated 2D or 3D plots. For xy datasets, only the curves that use the datasets are deleted.

![](images/f6ed2c5ab145f82d78849f9815f0092075aa46a390bf75e1a075223e859d7e7b.jpg)  
Figure 6 Manage Loaded Data dialog box showing active data

# Customizing Settings

You can customize the settings of Sentaurus Visual using the User Preferences dialog box (see Figure 7).

To display the User Preferences dialog box, choose Edit $>$ Preferences.

You can also import or export settings to a file by clicking Import or Export. To restore the preferences to their defaults, click Reset.

Alternatively, you can import and export settings using Tcl commands:

• To import previously saved settings, use the import_settings command (see import_settings on page 295).   
To export the current settings, use the export_settings command (see export_settings on page 249).

# Chapter 2: Basic Operations

Creating Custom Buttons to Access Scripts

# Note:

Settings are applied the next time you launch Sentaurus Visual.

![](images/4f7d1dd98ec03d93660612f27736a4546f3ce273ab15132ee1977fdecf0fdc1c.jpg)  
Figure 7 User Preferences dialog box showing selected settings

An additional option that can be modified in the configuration file converts the old coordinate system to the unified coordinate system (UCS). The Boolean parameter is called convert/ oldCoordinateSystemToUCS and belongs to the PlotHD group.

On Linux operating systems, user preferences are stored in the following file:

~/.config/Synopsys/SVisual.conf

# Creating Custom Buttons to Access Scripts

You can create buttons to make it easier to execute or load Tcl script files. Custom buttons are added to the Custom Buttons toolbar, which is located immediately below the menu bar and, by default, has the $^ { + }$ and - buttons.

# Chapter 2: Basic Operations Working With Plots

Each new button can be set up to load a Tcl script file or to execute directly a Tcl script code. For each button, you can assign text or an icon to display as the button, as well as a tooltip.

Custom buttons can be loaded at the start of a Sentaurus Visual session when it loads scripts stored in the Tcl script library (see Script Library on page 211).

When you click the button, Sentaurus Visual displays a message before and after the script is executed, so you can identify the section of the commands that is executed using the button. The message identifies the button that has been clicked by its name and description.

For more information, see add_custom_button on page 217, get_input_data on page 273, list_custom_buttons on page 301, and remove_custom_buttons on page 327.

# Working With Plots

Sentaurus Visual offers different modes when interacting with plots. These modes are independent for each plot instance and are enabled using toolbar buttons. However, you can apply mode changes to a group of plots by selecting the plots before applying the mode change.

# Modes When Interacting With Plots

By default, a group of linked plots shares the same mode. This behavior can be switched off in the User Preferences dialog box (expand Common $>$ Miscellaneous) by deselecting Plot Mode (see [8]). If this option is not selected, you can use special linking for a specific group of linked plots to change this behavior (see Linking Plots on page 51).

The modes temporarily modify the behavior of the left mouse button, allowing you to perform specific operations.

![](images/a905fcfee5699b66e45ffda486d08b8a1c0c0791a22e5a5377481e3198068983.jpg)  
Figure 8 User Preferences dialog box showing Plot Mode option selected (the default)

# Common Modes

All modes are enabled by clicking a toolbar button. The current mode remains active until you select another mode:

The Selection mode $\nwarrow$ (the default mode) allows you to select and move all objects inside plots (such as curves, legend, rectangles, and ellipses).   
The Zoom mode $4$ allows you to drag the left mouse button to draw a box. When you release the mouse button, the area delimited by the box will be magnified.   
The Probe mode allows you to extract data by clicking in the plot. For xy plots, curve data is extracted (see Probing on page 94). For 2D and 3D plots, structure data is extracted (see Probing on page 157).

# XY Plot–Only Modes

All modes are enabled by clicking a toolbar button. The Drawing mode displays a submenu of drawing options:

• The Draw Line mode allows you to draw a line with the left mouse button.   
• The Draw Rectangle mode allows you to draw a rectangle with the left mouse button.   
• The Draw Ellipse mode $\bigcirc$ allows you to draw an ellipse with the left mouse button.   
• The Insert Text mode $\scriptstyle \mathbf { \tilde { I } T }$ allows you to insert a text box with the left mouse button at a specified position.

# Note:

For all of these drawing options, when you release the mouse button, the current mode finishes and it changes to the Selection mode.

# 2D Plot–Only Modes

All modes are enabled by clicking a toolbar button. The modes specific to 2D plots only are:

• The Cut X mode , the Cut Y mode , and the Cut Z mode allow you to generate an axis-aligned (x, y, or z) cutline at a specified position (see Cutlines in 2D Plots on page 176). When you release the mouse button, the current mode finishes and it changes to the Selection mode.   
• The Cutline mode allows you to draw a cutline with the left mouse button. When you release the mouse button, the current mode finishes and it changes to the Selection mode.   
The Ruler mode allows you to draw a line with the left mouse button to perform a measurement. If you hold the Ctrl key while you click the mouse button, the snap-to-mesh mode is enabled (see Measuring Distances on page 153). This mode remains active until you select another mode.   
• The Drawing mode displays a submenu of drawing options:   
• The Draw Line mode allows you to draw a line with the left mouse button.   
• The Draw Rectangle mode allows you to draw a rectangle with the left mouse button.   
The Insert Text mode allows you to insert a text box with an arrow that can be repositioned using the left mouse button.

# Note:

For all of these drawing options, when you release the mouse button, the current mode finishes and it changes to the Selection mode.

# 3D Plot–Only Modes

All modes are enabled by clicking a toolbar button. The modes specific to 3D plots only are:

The Spherical Rotation mode allows you to perform a rotation in spherical coordinates using the left mouse button. This mode overrides the Selection mode as the default mode and remains active until you select another mode.   
The Rotation Axis X mode $\nwarrow$ , the Rotation Axis Y mode , and the Rotation Axis Z mode allow you to perform a rotation around a fixed x-axis, y-axis, or z-axis with the left mouse button. This mode cannot select plot elements (aside from the legend) and remains active until you select another mode.   
• The Cut X mode , the Cut Y mode , and the Cut Z mode allow you to generate an axis-aligned (x, y, or z) cutplane at a specified position (see Cutplanes in 3D Plots on page 190). When you release the mouse button, the current mode finishes and it changes to the Selection mode or the Spherical Rotation mode (depending on which mode was last active).   
The Ruler mode allows you to draw a line with the left mouse button to perform a measurement. If you hold the Ctrl key while you click the mouse button, the snap-to-mesh mode is enabled (see Measuring Distances on page 153). This mode remains active until you select another mode.

# Linking Plots

The feature of linking plots can be used to compare similar models, as it allows you to manipulate elements from one plot of the group, and the linked elements will change on all plots of the group. Elements that can be linked include material/region selection, field selection and properties, movement and rotation, cutplanes and cutlines, axes properties (only in xy plots and 2D plots), legend properties, curves properties, grid properties, and plot properties.

To link plots:

1. Select the plots to be linked by holding the Shift key and clicking the required plots.   
2. Click the toolbar button.

The linking operation links all properties except for y-axes and y2-axes in xy plots and streamlines in 2D and 3D plots. For customized linking properties, special linking can be used to link only specified properties and to set the remaining properties individually.

Plot linking also links the plot mode. This behavior is switched on by default and can be changed in the User Preferences dialog box (expand Common $>$ Miscellaneous) by deselecting Plot Mode (see Figure 8 on page 49). However, special linking can be used to change this behavior for particular groups of linked plots.

# Chapter 2: Basic Operations

Working With Plots

# Note:

All plot properties are linked by default, including the properties of the plot title, except the text of the title, which is independent of the other plots regardless of which linking option is selected.

To use special linking:

1. Select the plots to be linked by holding the Shift key and clicking the required plots.   
2. Click the toolbar button.

The properties that can be linked or unlinked with special linking include:

• Common properties:

◦ Legend settings and movement   
◦ Plot properties and plot mode

• Only for xy plots:

◦ Curve settings and grid settings   
◦ Axis settings (divided into x-, y-, and y2-settings)

• Only for 2D plots:

◦ Axis properties

• Only for 2D and 3D plots:

◦ Material or region selection   
◦ Field selection and field properties   
◦ Deformation and streamlines   
◦ Cuts

# Automatically Linking Plots

Plot linking is switched off by default. You can activate this feature automatically in the User Preferences dialog box as follows:

1. Choose Edit $>$ Preferences.   
2. Expand Common $>$ Miscellaneous.   
3. Under Linking, select Auto (see Figure 8 on page 49).   
4. Click Save.

# Chapter 2: Basic Operations

Working With Plots

When linking is set to automatic, plots are linked only if the following criteria are met:

Plots must be dimension compatible, that is, the plots must have the same dimensions. In addition, 2D plots can be linked to xy plots when generated by cutline operations (they will share the range of the common axis). Three-dimensional plots cannot be linked to xy plots.   
Plots must use the same coordinate system. For example, a 3D plot using UCS and a 3D plot using the DF–ISE coordinate system cannot be linked.   
Plots must use the same unit for axes. For example, if several 2D plots all use µm as the unit for their axes, then all these plots are linked. On the other hand, if one 2D plot uses µm and another 2D plot uses no units, then these two plots are not linked.

When linking is set to automatic, to distinguish plots, the following applies:

• The prefix A1 indicates an xy plot.   
• The prefix A2 indicates a 2D plot.   
• The prefix A3 indicates a 3D plot.   
• Linked 2D and 3D plots have the same suffix, such as .1, .2, and .3.   
• Linked xy plots have no suffix.

Figure 9 shows two linked plots, indicated by A2.2 in their upper-right corners. Both are 2D plots and both use the same units for their axes (µm). The other 2D plot is not linked (A2.1) because it is unitless. It has the suffix .1 because it is the first 2D plot in the plot area.

![](images/5a853235259382cf98a95a4240635079bbaf8792ad6db12f64dcd96ff4094360.jpg)  
Figure 9 (Top row) Unitless 2D plot and 3D plot that are not linked to other plots, and (bottom row) two automatically linked plots with the same dimension and the same units used for their axes

![](images/b7cf5cf948c20c1329ea5f0417e32c0ce59ce453da3fb39f336fcc8ac4c01107.jpg)

![](images/31bfdf144adf8330ce815c7a8db589d0c7a3ae6aeff683f7696c4ed85b80fc47.jpg)

![](images/93f2c3fa5d75a9594f7e12febfdc7bc4446341c3dc482c7623c3f3f80731fbb3.jpg)

# Undoing Operations

Most user interaction commands in Sentaurus Visual have undo functionality that allows you to revert recent changes to the visualization.

To undo an operation, click the toolbar button or use the undo Tcl command (see undo on page 383).

# Displaying Multiple Plots

In the plot area, multiple plots can be displayed in a grid, with or without keeping the aspect ratio. In addition, you can arrange plots horizontally or vertically.

# Grid Orientation

To display plots in a grid configuration (see Figure 10), choose Window $>$ Tile Grid.

# Chapter 2: Basic Operations

Working With Plots

![](images/ea6e11dba78dfb773517be467b818d13f788500ecfdd4b85372dba5af10d16da.jpg)  
Figure 10 Multiple plots keeping the same aspect ratio

![](images/e02d7364f460704a2f835e8c950db525f79a547f9c13dade2918f5229ba711bf.jpg)

![](images/a7761bd31f56d726e9f1e14d45a8d9f7bfa6aea606a4a98b56bccaf96bdc1015.jpg)

By default, the aspect ratio between plots is preserved, but this can be changed by deselecting Keep Aspect Ratio in the Manage Frames dialog box (see Figure 14 on page 58). Figure 11 shows plots where the aspect ratio is not maintained.

When the aspect ratio is not maintained, the unused space is filled with the last plot frame, but the aspect ratio of the structure is preserved.

# Chapter 2: Basic Operations

Working With Plots

![](images/09e5282312eeb05ed78725678aa9d106ffd61e51367b6f9d668737d590112e00.jpg)  
Figure 11 Multiple plots without keeping the same aspect ratio

![](images/a084d0172caa91dab9c536bd28bfbe65742c1875af8192b6118c6c975edb9e13.jpg)

![](images/f0c1121576855af29361d80ff3aae4a6338058d103aad7af06cba4c018fd83fa.jpg)

# Vertical Orientation

To arrange plots vertically (see Figure 12), choose Window $>$ Tile Vertically.

![](images/3f909c7f9f956c07d694ff955d16973989a957b9eb837672bb9cb0ed858cfc7e.jpg)  
Figure 12 Plots arranged vertically

![](images/a22185d31f1e549f2cb3340eaa1de23e0d8ab4d57368671b6f18e7ef7753cd71.jpg)

![](images/9b9045acab71ec7d5a3f45dbbb08d2edb3dcd389615bf79ff65fb4f733065355.jpg)

# Horizontal Orientation

To arrange plots horizontally (see Figure 13), choose Window $>$ Tile Horizontally.

# Chapter 2: Basic Operations

Working With Plots

![](images/1c05209e2d64ff167e18fe51c9418c9cb9a4adb74e3d3c154e6803cc411fe2ae.jpg)  
Figure 13 Plots arranged horizontally

![](images/c1f51b202db28293dd36d747c6b4e483a0accb617a4718c8c0b24ec039b17244.jpg)

![](images/924b92a008208155256d671492228048169a273b9e0bd31f926ddd63c21081c6.jpg)

# Managing Frames

More advanced sorting options can be configured in the Manage Frames dialog box (see Figure 14). To display the dialog box, choose Window $>$ Manage Frames.

![](images/2589bed680810825345c406298147b9a483fe3261fb6eb0bec008f65d036505b.jpg)  
Figure 14 Manage Frames dialog box

Features available include setting a custom grid, sorting plots in the plot area, and changing the direction in which new plots are placed on the grid. In addition, you can manage plots by minimizing them or restoring them using the Visible option.

# Drawing Inside Plots

Sentaurus Visual allows you to draw inside plots and to insert labels to allow plot customization. This feature is not available for 3D plots.

# Inserting Text

To insert text inside a plot, click the toolbar button, or use the draw_textbox command (see draw_textbox on page 245).

The text properties such as font size, font color, and position can be changed using the set_textbox_prop command (see set_textbox_prop on page 373). This feature is available for xy and 2D plots.

There is a difference between the behavior of text boxes in xy plots and 2D plots, which is related to the coordinate system:

In xy plots, the lower-left corner of the text box is placed at a specified point using the world coordinate system {x, y}. The text box keeps its position even if you perform a panning operation.   
The world coordinate system is a Cartesian coordinate system where the positions of objects, such as curves and drawn objects, are defined. The scale of the axes shows the world coordinate values.   
In 2D plots, the anchor arrow also exhibits this behavior, so it is placed at a specified point using the world coordinate system. However, the text box in 2D plots always retains its specified visual position even if you perform a panning operation. This is because the text box uses relative normalized screen coordinates, so its position is defined by numbers from 0.0 to 1.0, that is, $\{ 0 . 0 , 0 . 0 \}$ for the lower-left corner of the plot area and {1.0, 1.0} for the upper-right corner of the plot area.

# Drawing Rectangles

# Note:

This feature is available only for xy and 2D plots.

To draw a rectangle, click the toolbar button or use the draw_rectangle command (see draw_rectangle on page 244).

You can edit a rectangle using the user interface or the set_rectangle_prop command (see set_rectangle_prop on page 366).

To delete a rectangle, select the rectangle and press the Delete key.

To delete multiple rectangles simultaneously, use the remove_rectangles command (see remove_rectangles on page 331).

To list the rectangles inside a plot, use the list_rectangles command (see list_rectangles on page 311).

# Drawing Ellipses

# Note:

This feature is available only for xy plots.

To draw an ellipse, click the $\bigcirc$ toolbar button or use the draw_ellipse Tcl command (see draw_ellipse on page 242).

You can edit an ellipse using the user interface or the set_ellipse_prop command (see set_ellipse_prop on page 352).

To delete an ellipse, select the ellipse and press the Delete key.

To delete multiple ellipses simultaneously, use the remove_ellipses command (see remove_ellipses on page 329).

To list the ellipses inside a plot, use the list_ellipses command (see list_ellipses on page 305).

# Drawing Lines

# Note:

This feature is available only for xy and 2D plots.

To draw a line, click the toolbar button or use the draw_line Tcl command (see draw_line on page 243).

You can edit a line using the user interface or the set_line_prop command (see set_line_prop on page 359).

To delete a line, select the line and press the Delete key.

To delete multiple lines simultaneously, use the remove_lines command (see remove_lines on page 330).

# Exporting Plots

You can export plots to an image file. Sentaurus Visual supports exporting plots to the following file formats: BMP, EPS, JPG, JPEG, PNG, PPM, TIF, TIFF, XBM, and XPM.

To export plots:

1. Choose File $>$ Export Plot, press Ctrl+E, or click the toolbar button.

The Export Plot dialog box opens.

![](images/a93f985bd65c5225100323392721173cc9bbfe64cfbb357899415e379ebb7b7a.jpg)

2. Select the option to export multiple plots.   
3. Select the option for the resolution.   
4. Click OK.

# Note:

The User Defined option is not available if you select All Plots to One File.

If you specify a custom resolution rather than select Screen Resolution, then the exported plots might look different on-screen due to rescaling to the chosen resolution.

# Exporting Movies

You can export several captures of one or more plots to generate an animated GIF file.

# Starting a New Movie

To start a new movie:

1. Choose Tools $>$ Movies $>$ Start Recording, or click the toolbar button.

The Start Recording dialog box opens, where you can generate frames for the movie.

![](images/5661ea66fe0e2760c50ee7ee94004400f452ea901ff605ec9f191d570dd3f300.jpg)

2. Select the resolution:

◦ The Screen Resolution option keeps the size of the current view.   
◦ The User Defined option allows you to specify the size of the capture in pixels.

3. Click OK.

# Adding Frames in a Movie

To add a new frame in the movie:

1. Click the required plot to select it.

To select multiple plots, hold the Shift key while clicking the plots.

2. Choose Tools $>$ Movies $>$ Add Frames, or click the toolbar button.

If several plots are selected, one frame for each plot is generated.

# Exporting a Movie

To export a movie:

1. Choose Tools Movies Stop Recording, or click the 3 toolbar button. $>$ $>$

The Export Movie dialog box opens.

![](images/7636a0ccc41b725a0ac3f3df31865ef7c5aa0eff2545862c6d131f8368c2e5ef.jpg)

2. To see a preview of a frame, click an item in the left pane.   
3. Select the frames to export from the left pane.

To make multiple selections, drag to highlight the frames or hold the Ctrl key while clicking the frames. At least one frame must be selected.

4. If required, change the order of the frames by selecting a frame from the left pane, and clicking Up or Down.

# Note:

The movie is recorded sequentially from the first frame to the last frame.

5. Set the duration of each frame in the Frame Duration field (the unit is 1/100 s).   
6. Click OK to save the file.

Click Cancel to delete the entire frame buffer.

7. In the dialog box that opens, ensure that the file has the .gif extension. Add the extension if it is missing.

# Printing Plots

You can print selected plots by either clicking the toolbar button, or choosing File $>$ Print Plots, or pressing Ctrl+P.

The Printer dialog box is displayed, where you can select a printer and set print properties.

Note:

All plots are printed on one page.

# Zooming and Panning

To take a closer look at significant details on a plot, there are various ways to zoom. On a selected plot, you can zoom by using the mouse wheel, or by clicking the middle mouse button and moving to the top or bottom of the screen. To pan, drag while holding the right mouse button.

# Zoom Tool

The zoom tool is used to magnify a particular area of a plot.

To select the zoom tool:

1. Click the toolbar button.   
2. Draw a rectangle by dragging the mouse over the area you want to magnify.

# Reset Tool

The reset tool restores the selected plot position and zoom level. It does not restore the rotation on 3D plots.

To select the reset tool:

► Click the toolbar button.

# Deleting Plots

To delete selected plots:

► Choose Data $>$ Delete Selected Plots or press Ctrl+D.

# Note:

Deleting a plot does not delete the associated dataset. To delete the datasets or the plots or both, choose Data $>$ View Info Loaded (see Figure 6 on page 46).

# Performance Options

Working with complex 2D and 3D plots can be sometimes slow. To improve this, Sentaurus Visual provides two options to work faster with plots.

# Fast Draw (3D Plots Only)

This option draws only the boundaries of a 3D plot when it is manipulated, which has a large impact on performance.

To activate fast draw:

► Choose View $>$ Fast Draw or click the

![](images/0d968ff8bc9e5a6812fd48eec9f8ed0ea035efb2163b6e960a37740d50e3c68e.jpg)

toolbar button.

# Subsampling (2D and 3D Plots Only)

This option reduces the data points when manipulating a plot, enabling better performance on slower computers.

To activate subsampling:

► Choose View $>$ Subsampling.

# Advanced Options (XY Plots Only)

You can customize the minimum value to be displayed in log scale for xy plots. This configuration can be changed in the User Preferences dialog box (choose Edit > Preferences) in the Curve pane (see Figure 15).

You can change the minimum value using the Min Plot Value field. By default, this value is 1e-20. The minimum value is 1e-300. If you specify a value less than the minimum, the value will be rounded up to the minimum value.

Under Performance, you can use the available fields to improve the performance of Sentaurus Visual when displaying large .plt files. You can reduce the number of points used to define a curve displayed in a plot, which decreases the time taken to draw a curve with a large number of points.

# Chapter 2: Basic Operations

# Performance Options

You must define the following fields:

Points/Curve specifies the lower limit at which to activate the Level of Detail algorithm when displaying a curve. The default value is 5000. This means that any curve containing more than 5000 points will switch on this algorithm when displaying the curve. Any curve with fewer than 5000 points will not use this algorithm.   
Pixels/Point defines the distance in pixels where only one point will be displayed. The default value is 5. This means that any point that is more than 5 pixels away from an already plotted point will be plotted. Any point that is less than 5 pixels away from an already plotted point will not be plotted.

# Note:

For large .plt files, using the Level of Detail algorithm increases performance, but the accuracy of the drawn curves decreases.

![](images/e4a17099a1dbfb4fdabc768bbbe5a7a121b04426e79dd524a9c2fcbd50308ea3.jpg)  
Figure 15 Options for xy plots in User Preferences dialog box

# Advanced Options (2D and 3D Plots Only)

Advanced configuration of rendering can be changed in the User Preferences dialog box (choose Edit $>$ Preferences). In this dialog box, in the Category pane, expand 2D/3D $>$ Rendering. Figure 16 shows the rendering fields available.

![](images/800bd1408ec6d0df59d11702a8a1f70db7d99c33376728b20bb274e8106b6d72.jpg)  
Figure 16 Performance options

Advanced options include setting the rendering delay after a mouse operation, modifying the quality of the subsampled interactive structure, and enabling the caching functionality for fields:

The End Mouse Interaction Render Delay field adjusts the delay after interacting with the structure in subsampling or fast draw mode, to redraw the detailed geometry.   
The Subsampling option enables the structure to be rendered with fewer points, which optimize the interactive performance with little degradation of the rendering quality.

# Chapter 2: Basic Operations

# Performance Options

If you select the Automatic option, Sentaurus Visual automatically renders the subsampled structure. When you select the Automatic option, the value in the Factor field is used to fine-tune the algorithm to either performance or quality. A higher value means a higher quality subsampled structure, and a lower value means a lesser quality structure but with better interactive performance.   
If you do not select the Automatic option, you can use the Performance/Quality slider to manually choose the quality of the subsampled structure. Moving the slider to the left prioritizes interactive performance, or moving the slider to the right prioritizes rendering quality.   
• The Enable Fast Draw option enables drawing of the boundaries only of 3D structures.   
• The Enable Field Caching option helps you to obtain faster transitions between different field visualizations. When it is selected, this option avoids the recalculation of visualization field data that has already been loaded and for which its configuration has not changed.   
The Disable Drawing option helps you to improve the loading of files in Sentaurus Visual. This option switches off plot drawing when loading several files and then switches it on when the loading of files is finished.   
The Show Borders option switches on or off the default visualization of region border lines in 2D and 3D plots.   
The Projection options allow you to set the default value of the camera projection to either perspective or parallel coordinates (see Interacting With 3D Plots on page 121).   
The Show Label option sets the default behavior for the ruler to show the distance label in the plot or to not show the distance label (see set_ruler_prop on page 369).

The effects of rendering the structure with subsampling or with the Enable Fast Draw option selected are shown in Figure 17.

# Note:

These changes are active only when in GUI mode. When the operation is completed, the full rendering is shown.

![](images/c3aa2405beee2c4619585ea55acfeea8a1e9f54cbe262ea7d5eedccf375e4fb7.jpg)  
Figure 17 (Left) Fast draw enabled, (middle) subsampling selected, and (right) original structure

![](images/334b420944f46b7320142689ee7a1e20e66769c79859c95a18c6f4928b696a82.jpg)

![](images/45c58d4e38269f30842480a28d6b950250ba1f86abab5a8c1f1b4ce5c55b7f9d.jpg)

# Selecting Log Files

# Note:

This feature applies to both Tcl and the Python scripting language.

By default, Sentaurus Visual generates a standard log file with all the commands executed during a session, named SVisualTcl.log for Tcl or SVisualPy.log for Python. This log file does not store commands executed by a script or procedure. If this log file already exists, then Sentaurus Visual renames this file by adding the .BAK extension.

In addition, by default, another Tcl log file is created if Sentaurus Visual is executed from the command line (or Sentaurus Workbench) with a script. For example:

% svisual scriptFile.tcl

This additional log file not only stores Tcl commands executed during the session, but also writes Sentaurus Visual Tcl commands executed from a script. In this case, the log file contains more detailed information than the standard Tcl log file. This additional log file is named according to the script executed from the command line (or Sentaurus Workbench), changing the file extension of the script from .tcl to .log, for example, scriptFile.log.

To change the selection of log files:

1. Choose Edit $>$ Preferences.   
2. In the User Preferences dialog box, expand Application $>$ Common.

# Chapter 2: Basic Operations

# Selecting Log Files

3. Under Tcl Logging, change the selected options as required.

![](images/3bdf5a428632dfbb67ad3feb17a88621f9de6af6febd07df8f19a32f72c037e4.jpg)

4. Click Save.

# 3

# 3Working With XY Plots

This chapter presents specific topics about working with xy plots in Sentaurus Visual.

# Loading XY Plots

Loading an xy file does not automatically plot the dataset associated with it. Instead, the loaded datasets appear in the Data Selection panel, and a blank plot is created as shown in Figure 18.

The top pane corresponds to the datasets loaded, the middle pane shows the variables present in the selected dataset, and the bottom pane lists the composite variables available in the middle pane.

# Note:

For . $\mathtt { . p l x }$ files and cutline plots, the x-axes and y-axes are assigned automatically, and the respective curve is generated onto the active plot.

![](images/fcbfcb0c87abc4799660b6d5e70b76f881010d0fb8b1daa42c610121c2e7e615.jpg)  
Figure 18 Data Selection panel showing (left) active datasets of xy plot and (right) active datasets of cutline plot

![](images/7d58eb9f48cbb73f357996b687641f503466b998a393d3c96e0ab44cd9ecb4a2.jpg)

# Plotting One Curve

To plot an xy curve, you must select a dataset, and then assign the x-axis and y-axis variables from the available options in the middle pane (or bottom pane if one variable is a composite). The result of selecting vd as the x-axis variable and ib as the left y-axis variable from the vd_ib_vb0_vg0.6_vs0 dataset can be seen in Figure 19.

![](images/8e3344f3c4df9b500c5c91766cc6b7d40355de0922deb6ae707c7aacf95e10cd.jpg)  
Chapter 3: Working With XY Plots Loading XY Plots   
Figure 19 Plotting a single xy curve

# Plotting Multiple Curves

To display multiple datasets on the same plot:

1. Hold the Ctrl key and click the required datasets.   
The common variables in the datasets selected are displayed in the middle pane and bottom pane.   
2. Repeat the procedure in the same way as for plotting one curve.

As shown in Figure 20, five datasets were selected; v(g) was selected as the x-axis variable and $i d ( v d , d )$ was selected as the left y-axis variable.

![](images/bc73ece5f8acdbe155a9f87b78c2a4289f79cac4f64bbbcdbf69c7289b885c20.jpg)  
Chapter 3: Working With XY Plots Loading XY Plots   
Figure 20 Plotting multiple xy curves

When you display multiple curves in an xy plot, the curves are colored according to user-defined rules set in the User Preferences dialog box (expand 1D $>$ Curve Colors). By default, Sentaurus Visual displays curves using a round-robin logic from a list of colors as shown in Figure 21 on page 75.

To add a custom color to the list of colors:

1. Under Curve Color Behavior, select List Colors.   
2. Under Curve Color Selection, click Add.   
3. In the dialog box that opens, specify a custom color.   
4. Click OK to close the dialog box.   
5. Click Save.

![](images/82c3c825e5138a9c34435393fb52a433fee32e948558f1914e6c25d68a8c9367.jpg)  
Figure 21 List of default curve colors

To set the same color for all curves in xy plots:

1. Under Curve Color Behavior, select Constant Color (see Figure 22 on page 76).   
2. Under Curve Color Selection, select a color from the list.   
3. Click Save.

You can also map colors to curves using curve labels as well as wildcards. The color-to-curve mapping rules are applied from top to bottom.

To map colors:

1. Under Curve Color Behavior, select Map Colors.   
2. Under Curve Color Selection, specify the mapping as required (see Figure 23 on page 77).   
3. Click Save.

![](images/e28031a13ae47082b5280427995d1f49ea844c0360dccaa4f12eb3c543d0dc60.jpg)  
Figure 22 User Preferences dialog box showing a constant curve color has been specified

![](images/20d5166e97a1c36e3f12cb9c42dbb390b898130da65879b59f7153c922daeb51.jpg)  
Figure 23 Mapping curve colors

# Visualizing Multiple TDR States

TDR files can contain multiple states of different simulation results. The states are related with regard to geometry. In other words, the main structure data (the number of points) is maintained in all states but their variable data changes. Sentaurus Visual allows you to visualize all the states.

For xy plots, variables can have multiple states. If a curve is created using such variables, a navigation area specific to the existing curve is displayed to allow you to easily navigate through the different states of the curve (see Figure 24 on page 78).

![](images/8a233959e43535238b17222d784d762ef334d5f7354d2cc919fa8d51b4541982.jpg)  
Figure 24 Navigation area displaying state name and state index of curve

The navigation area allows you to switch between displayed states quickly with the:

• Next State button   
• Previous State button   
• First State button   
• Last State button

With any change to the state index, the plot title will be updated reflecting the state name.

In addition, the Play button allows you to automatically go through all the states, with a 1 second delay between changes, in ascending order. If the last state is reached and the Play button is still active, the sequence will restart.

If displayed curves do not have the same states, the navigation area changes to display the generic state name state and the state index of all curves (see Figure 25).

![](images/054d1ccf80add5d689b047fb896d655e0d0a2c1768151094082e9afd7dadf888.jpg)  
Figure 25 Navigation area displaying state index of curve

When displaying more than one curve with different state lengths, if you increase the state index to be displayed and one of the curves already reaches its maximum state number, that curve will remain in the maximum valid state number and only the other curves will continue changing accordingly. Switching the state of a curve is a property of a plot, but it cannot be handled in isolation for a single curve being plotted with other curves with different state lengths.

Plotting a multistate curve together with non-multistate (normal) curves will still display the navigation area and the navigation of the multistate curves as previously described. However, normal curves are not affected by any state changes.

# Cutline Plots

Cutline plots have a special interface that allows you to plot new curves by simply selecting one or more variables from a single dataset or a set of datasets. The curve visualization depends only on the datasets and variables selected in the Data Selection panel (see Figure 26 and Figure 27). You only need to select a new variable (or a set of them) to remove the old curves and to create new ones.

The Data Selection panel does not have the buttons to assign variables to the x-axis or y-axis, but it maintains the New Variable button and implements the Duplicate Plot button that is used to duplicate the current plot as an xy plot, which enables the features of an xy plot for the currently displayed cutline plot by cloning it.

Cutline plots have a special plot title that follows the format: Cutline_* Plot, where * can be X, Y, Z, or Free, depending on the type of cut. This helps to distinguish cutline plots from xy plots.

![](images/3e7abcb62b30cbd7d0e313f7872ffd7398e4fcaa8234fca8644406b3313c0308.jpg)  
Figure 26 Cutline plot displaying DopingConcentration from two datasets

![](images/9c061ee616eee484502d607e69257d04673528de0bf95a6675b7b86043f9b259.jpg)

![](images/a1c8900ac2bcc3956fc49f3494a13c24820c5e7801a412156112081d5956deac.jpg)  
Figure 27 Cutline plot displaying LatticeTemperature from two datasets

![](images/7a85b153fc463ba61822b4c7b2f63ba77b32e4863e02b3ff2cbe5f663662cf4a.jpg)

# Curve Properties

To edit the properties of a curve, select it from the active plot, or you can select the curve from the list in the Data Selection panel. You also can select multiple curves in the Data Selection panel and apply properties to all of them. The Curve Properties panel is displayed (see Figure 28 on page 81).

In the Curve Properties panel:

On the Main tab, you can change the label of the curve, and select to show or hide the legend and named curve.   
On the Shape tab, you can change properties such as curve color, line style, line width, and data pointers.   
On the Trans. tab, you can apply curve transformations. It is possible to apply an integration or the first and second derivative to the dataset, or to plot a function using the

dataset values to evaluate the required function. In addition, you can shift and scale the selected curve in the x-axis and y-axis.

On the Analysis tab, you can perform certain analyses on the dataset. For a detailed explanation, see Computing Electrical Characteristics on page 97.

![](images/b95244e7f5bbc20265d6b99845766d7cbebd227eaad1a1131f73ae145143e46d.jpg)  
Figure 28 Curve Properties panel

# Modifying Properties in Multiple Curves

Sentaurus Visual provides a dialog box where you can modify all curve properties in one view (see Figure 29). You can modify one property in several curves at the same time.

To modify a property in multiple curves:

1. Choose Data $>$ Curve Properties, or click the

![](images/3811e920dfa60bee3fcbd125e27792b3ee4b3a562f43f2dc770b880a4fb72544.jpg)

toolbar button.

2. Select the required curve rows.   
3. Click the column header of the property you want to modify.

A dialog box is displayed where you change the value of the property.

In addition, you can change the order of curves. To do this, select one or more curve rows, and click either the Up arrow button or the Down arrow button at the left of the dialog box.

The order of curves changes immediately and is displayed in the legend as well as the list of curves in the Data Selection panel.

![](images/bc6ccdf5e93607e2b261a9c3d28811025f379c0952b60d858d9348249f384d68.jpg)  
Figure 29 Curve Properties dialog box

# Plot Area Properties

The appearance of the plot area can be modified using the Plot Properties panel (see Figure 30). The Plot Properties panel allows you to change such attributes as the background and foreground colors of the plot, and to show or hide the title, legend, axes, curves, or background color of regions.

![](images/f1cbdc6991748166a55c279d819ce4dfea66d06e9040f3c81beacaab7cceec69.jpg)  
Figure 30 Plot Properties panel showing selected options

For example, to hide the legend:

1. Select the plot.   
2. On the Main tab, deselect Legend.

# Note:

To show the Plot Properties panel, double-click an empty part of the required plot if another panel is active.

# Legend Properties

Legend properties such as position, font attributes, and colors can be changed in the Legend Properties panel (see Figure 31). To open the panel, double-click the legend of an xy plot.

![](images/c5070e89102d3cb20a12d2d5d5bddb41969dd518bebf67a44114ca1ce99caf36.jpg)  
Figure 31 Legend Properties panel

# Axis Properties

The appearance of axes can be modified using the Axis Properties panel (see Figure 32). To open the Axis Properties panel, double-click any axis in the plot area. See Quick Access to Tabs of Plot Properties and Axis Properties Panels on page 29.

![](images/116b310d4660de1ce4f430be1eec7aae201e9c751fa35b5a2f9d9a246facf5c3.jpg)  
Figure 32 Axis Properties panel showing selected options

# Changing the Axis Padding

You can change the padding value using the Padding field on the Main tab of the Axis Properties panel. By default, the Auto option is selected for padding, in which case, the padding value is calculated automatically and cannot be edited.

When several xy plots are linked and the Auto option is selected, the padding for each axis is the same for all linked plots. The padding value used is the largest padding value of each axis from all linked plots. This feature helps to compare curves or plots visually.

# Changing the Axis Precision

You can set the precision of the axis (for xy plots and 2D plots) on the Title/Scale tab of the Axis Properties panel (see Figure 33). The precision refers to the number of relevant digits after the decimal point.

![](images/134c90d492a45a9dcbf3fc6f105235b8b5cd01ecf92594bc777eba8dd76682ed.jpg)  
Figure 33 Axis Properties panel showing the Title/Scale tab where you can change the precision of the axis manually

By default, the precision is chosen automatically based on the dimension of the plot, but this can be manually changed:

1. Deselect Auto.   
2. In the Precision box, select the precision required.

# Duplicating XY Plots

You can duplicate an xy plot by choosing Data $>$ Duplicate Plot. All properties of the selected plot are replicated in a new plot.

# Using Symbols and Scientific Notation in Plots

You can insert Greek symbols, subscripts, superscripts, and math symbols in xy plots by using XML tags in the text box of the plot title, the axis labels, and the legend. The available tags are:

<table><tr><td>Symbol</td><td>Tag</td><td>Example</td><td>Result</td></tr><tr><td>Greek symbol</td><td>&lt;greek&gt;</td><td>&lt;greek&gt;abcdefgh&lt;/greek&gt;</td><td>αβχδεφγη</td></tr><tr><td>Math symbol</td><td>&lt;math&gt;</td><td>&lt;math&gt;plusminus&lt;/math&gt;</td><td>± (See Table 4.)</td></tr><tr><td>Subscript</td><td>&lt;sub&gt;sub&lt;/sub&gt;</td><td>V&lt;sub&gt;sub&gt;d&lt;/sub&gt;/sub&gt;</td><td>Vd</td></tr><tr><td>Superscript</td><td>&lt;sup&gt;sup&gt;&lt;/sup&gt;</td><td>10&lt;sup&gt;sup&gt;-8&lt;/sup&gt;/sup&gt;</td><td>10-8</td></tr><tr><td>Bold</td><td>&lt;b&gt;</td><td>&lt;b word&lt;/b&gt;</td><td>word</td></tr><tr><td>Italic</td><td>&lt;i&gt;</td><td>&lt;i word&lt;/i&gt;</td><td>word</td></tr><tr><td>Underline</td><td>&lt;U&gt;</td><td>&lt;U word&lt;/U&gt;</td><td>word</td></tr><tr><td>Strikethrough</td><td>&lt;s&gt;</td><td>&lt;s word&lt;/s&gt;</td><td>word</td></tr></table>

Table 4 lists the defined words that are allowed in the <math> tag. Only one word is allowed in the <math> tag.

Table 4 Defined words that are allowed in <math> tag   

<table><tr><td>Word</td><td>Result</td><td>Word</td><td>Result</td></tr><tr><td>3root</td><td>3√</td><td>laplace</td><td>L</td></tr><tr><td>4root</td><td>4√</td><td>mho</td><td>U</td></tr><tr><td>contains</td><td>∅</td><td>notcontains</td><td>∅</td></tr><tr><td>contourintegral</td><td>∅</td><td>notelementof</td><td>∉</td></tr><tr><td>deriv</td><td>∂</td><td>notexist</td><td>∛</td></tr><tr><td>doubleintegral</td><td>∫∫</td><td>permille</td><td>‰₀</td></tr><tr><td>e</td><td>e</td><td>permyriad</td><td>‰₀₀</td></tr><tr><td>elementof</td><td>∈</td><td>plusminus</td><td>±</td></tr><tr><td>emptyset</td><td>∅</td><td>sqroot</td><td>√</td></tr><tr><td>exists</td><td>∃</td><td>sum</td><td>∑</td></tr><tr><td>forall</td><td>∀</td><td>surfaceintegral</td><td>∫∫</td></tr><tr><td>fourier</td><td>F</td><td>tripleintegral</td><td>∫∫∫</td></tr><tr><td>gradient</td><td>∇</td><td>union</td><td>∪</td></tr><tr><td>inf</td><td>∞</td><td>volumeintegral</td><td>∫∫∫</td></tr><tr><td>integral</td><td>∫</td><td></td><td></td></tr></table>

The text in xy plots also supports HTML symbols without using an XML tag pair, so as to avoid conflicts with reserved characters such as $<$ and $>$ . To use HTML symbols, you can use either the entity number with the &# prefix or the entity name with the & prefix, for example, &Delta;I [mA/&mu;m] shows as ΔI [mA/µm]. Table 5 lists some of the frequently used HTML symbols.

# Chapter 3: Working With XY Plots

Using Symbols and Scientific Notation in Plots

# Note:

Not all entities have a name, but all can be referenced by a number.

Table 5 Frequently used HTML symbols   
Figure 34 shows an example of how these symbols are displayed.   

<table><tr><td rowspan="2">Result</td><td colspan="2">Entity</td><td rowspan="2">Result</td><td colspan="2">Entity</td></tr><tr><td>Name</td><td>Number</td><td>Name</td><td>Number</td></tr><tr><td>A</td><td>&amp;Alpha;</td><td>&amp;#913;</td><td>\(3\sqrt{ }\)</td><td>-</td><td>&amp;#8731;</td></tr><tr><td>α</td><td>&amp;alpha;</td><td>&amp;#945;</td><td>\(4\sqrt{ }\)</td><td>-</td><td>&amp;#8732;</td></tr><tr><td>Ω</td><td>&amp;Omega;</td><td>&amp;#937;</td><td>\( θ \)</td><td>&amp;ni;</td><td>&amp;#8715;</td></tr><tr><td>ω</td><td>&amp;omega;</td><td>&amp;#969;</td><td>€</td><td>&amp;isin;</td><td>&amp;#8712;</td></tr><tr><td>©</td><td>&amp;copy;</td><td>&amp;#169;</td><td>U</td><td>&amp;cup;</td><td>&amp;#8746;</td></tr><tr><td>®</td><td>&amp;reg;</td><td>&amp;#174;</td><td>∩</td><td>&amp;cap;</td><td>&amp;#8745;</td></tr><tr><td>TM</td><td>&amp;trade;</td><td>&amp;#8482;</td><td>φ</td><td>-</td><td>&amp;#8750;</td></tr><tr><td>%‰</td><td>&amp;permil;</td><td>&amp;#8240;</td><td>∂</td><td>-</td><td>&amp;#8706;</td></tr><tr><td>½</td><td>&amp;frac12;</td><td>&amp;#189;</td><td>∫</td><td>&amp;int;</td><td>&amp;#8747;</td></tr><tr><td>¼</td><td>&amp;frac14;</td><td>&amp;#188;</td><td>∫∫</td><td>-</td><td>&amp;#8748;</td></tr><tr><td>·</td><td>-</td><td>&amp;#8729;</td><td>Σ</td><td>&amp;sum;</td><td>&amp;#8721;</td></tr><tr><td>°</td><td>&amp;deg;</td><td>&amp;#176;</td><td>L</td><td>-</td><td>&amp;#8466;</td></tr><tr><td>√</td><td>&amp;Ric;</td><td>&amp;#8730;</td><td>∞</td><td>&amp;infin;</td><td>&amp;#8734;</td></tr></table>

![](images/3346e50c70ee16825bcf4c1659ed77ee6eb0be4e06d6840647a6f6498e194881.jpg)  
Figure 34 Plot showing Greek symbols, math symbols, and scientific notation in axis labels and legend

You also can use scientific notation in the axis labels of xy plots by choosing Scientific from the Format list on the Title/Scale tab of the Axis Properties dialog box (see Figure 35).

![](images/fd2d21766b1500a6147a2cd4de3c242f129d5cd8ee86353b73cfbd7c62c3b4f6.jpg)  
Figure 35 Axis Properties dialog box showing the selection of scientific notation

# Best Look Option

Best look is an option that selects the optimal parameters for the active plot automatically. This option has the following functions:

Adjusts the zoom level to the optimal position, and changes the x-axis label to the variable used if it is common between curves   
Changes the label of the legend to the variable being plotted (if there is only one curve, it switches off the legend and uses the variable name for the y-axis label)   
• Changes the title to the dataset name if all curves share the same dataset

To activate best look, click the toolbar button.

# Plotting Edges of Depletion Regions

You can visualize the edges of depletion regions as vertical lines in xy plots. The x-values of the edges are obtained by using the get_vertical_lines_prop command (see get_vertical_lines_prop on page 293).

To show or hide all edges of depletion regions, click the toolbar button.

# Chapter 3: Working With XY Plots

Plotting Edges of Depletion Regions

The dataset must have the following variables defined (variable names are italicized):

• Electron density (eDensity)   
• Hole density (hDensity)   
• At least one of the following doping fields:

◦ DopingConcentration   
◦ NetActive   
◦ NetDoping

If the dataset does not meet these requirements, then the toolbar button is not available.

![](images/ac0da6e26a6c7fcad99b2006f440150c78eaf5392e74dc54997d62cd8514b2ff.jpg)  
Figure 36 Example of visualizing edges of depletion regions; edges are indicated by black lines

# Chapter 3: Working With XY Plots

Plotting Band Diagrams

You can change the color, style, and width of the edges by using either the set_vertical_lines_prop command (see set_vertical_lines_prop on page 379) or the Vertical Lines Properties dialog box (double-click one of the edges to open the dialog box).

![](images/59ae6fe2b483e4abd783cd6f19e6ea071599ed1a95c6c9013a18c6d71b6effd0.jpg)  
Figure 37 Vertical Lines Properties dialog box showing modifiable properties

# Plotting Band Diagrams

Sentaurus Visual allows you to plot band diagrams, which show the electron energy of the valence band and the conduction band edges versus a spatial dimension.

To create a band diagram for datasets, click the toolbar button.

![](images/376b36f192bdaf8096b7bb97b0befbca1235d25aa9490d743b0a54bf9f9c10f5.jpg)  
Figure 38 Example of a band diagram

# Chapter 3: Working With XY Plots

Plotting Band Diagrams

The dataset must have the following variables defined (variable names are italicized):

• Conduction band energy (ConductionBandEnergy)   
• Valence band energy (ValenceBandEnergy)   
Electron quasi-Fermi energy (eQuasiFermiEnergy) or electron quasi-Fermi potential (eQuasiFermiPotential) but not both in the same dataset   
Hole quasi-Fermi energy (hQuasiFermiEnergy) or hole quasi-Fermi potential (hQuasiFermiPotential) but not both in the same dataset

# Note:

Typically, band diagrams are created from xy datasets resulting from cuts of 2D or 3D geometries.

# Visualizing Discrete Traps in Band Diagrams

A special visualization case is discrete traps in band diagrams. Discrete traps are visualized as rectangular markers by default. However, you can also display traps as circles, diamonds, x-symbols, or plus symbols.

![](images/27b49fdaa967e6bd0af5514324db347fb2a6f3fb0dac9c2cb84363587b8496f8.jpg)  
Figure 39 Visualizing discrete traps in a band diagram

Discrete traps have three components: position, energy, and scalar field. The scalar field is used to color the discrete traps from red to blue, with red indicating the maximum value and

blue indicating the minimum value. You can use the probe tool to obtain the value of each discrete trap (see Probing on page 94).

# Visualizing Data as a Step-Like Plot

A special visualization case is the step-like plot, which is activated when data is elemental (data is on the edges) and the Convert to Nodal option on the Levels tab of the Data Selection panel is not selected.

A step-like plot retains the value of the data until the next value and then jumps to this value, thereby generating a discrete visualization of data. If the Convert to Nodal option is selected, then data is interpolated in the center of the cell.

![](images/e6e438c0f905cf48ce1e9cfc42e69c705b71cf302d79411b4ed74a63126fc495.jpg)  
Figure 40 (Left) Typical visualization of data and (right) visualization of data as a step-like plot

![](images/9cb90b647f2a584a88a9710adb67cfc6a8346275de2b0ad05a1aac5d6ffe3ab3.jpg)

# Saving the Plot to a Tcl File

Sentaurus Visual can save the current xy plot (including the plot settings, curve data, and displayed curves) to a Tcl file that allows you to recreate the plot easily. You can either choose Data $>$ Save Plot or use the save_plot_to_script command (see save_plot_to_script on page 337).

When the file is generated, you can either choose File $>$ Run Script or use the load_script_file command to reproduce a previously saved plot (see load_script_file on page 321).

The generated file has a particular structure that you can edit for customized loads:

Plot Configuration Module: This module updates the plot with the saved properties, which is performed with the set_axis_prop, set_grid_prop, set_legend_prop, and set_plot_prop commands (the set_axis_prop command is executed for x-axes, y-axes, and y2-axes).   
Curves Configuration Module: This module updates the curves with their saved properties such as color and line width. The update is performed with the set_curve_prop command.   
Drawings Restoration Module: This module places the drawings in the plot and restores their properties.

# Note:

Only text box properties are restored. Other drawings properties must be updated manually.

Data Initialization Module: This module initializes the curve data using a Tcl array structure. The final data is stored as:

set datasetList(<curveName>) { {<xAxisData>} {<yAxisData>} }

Plot and Curves Restoration Module: After its initialization, the data module creates the xy plot and then creates the curves using the datasetList data. In general, this module should never be modified.

# Probing

You can sample the intersection value for a horizontal or vertical line depending on whether probing is performed on the x-axis or y-axis. In xy plots, the probe tool uses the interpolation that matches the axis to obtain the value: linear when the axis is in normal mode and log when the axis is in log mode.

To use the probe tool, click the toolbar button.

# Probe Options

In the Probe panel, the following options are available:

• To show the active curve only, select Only Active Curve.   
• To show guide lines while probing, select Show Guide Lines.   
• To show and use the closest point on the curve, select Snap to Point.

# Performing Complex Mathematical Operations on 1D Data

You can perform complex mathematical operations on available 1D data in memory. To display the Calculate Scalar dialog box, choose Tools $>$ Calculate Scalar.

![](images/b366d7b039f9989bb4389147c723ddef0d674233f44f72bc43f380f17f53bb84.jpg)  
Figure 41 Calculate Scalar dialog box showing the results from the mathematical operations in the Function field

In the dialog box, you create a formula by inserting functions and operators, and using existing 1D data. For the latter, you must select whether the formula will operate on variables (from a dataset) or curves (from a plot).

# Note:

The last operation that encloses the entire set of functions must be a scalar value function. Otherwise, the calculation will fail.

# Performing Complex Mathematical Operations on Curves

You can perform complex mathematical operations on available curves.

To display the Create New Curve dialog box, in the Data Selection panel, click the Curves tab and then click the New button.

![](images/6011a24cfbfa17019c8c89b31fc6e3cf47bab8419ce80f6ae120f76f59ae5ef3.jpg)  
Figure 42 Create New Curve dialog box showing available mathematical operations

Curves can have different values of x or length, and all operations are allowed. When this happens, the original curves are interpolated to obtain two curves with the same values of x that allow the operations to be performed point by point.

# Computing Electrical Characteristics

You can compute the electrical characteristics of field-effect transistors. Depending on the curve being plotted, you can perform different analyses, such as the threshold voltage, the maximum transconductance value, the drain saturation current, the leakage current, and the output resistances in the linear or saturation region.

To use the analysis tool, click the toolbar button.

Table 6 Types of curve analysis   

<table><tr><td>Type of analysis</td><td>Description</td></tr><tr><td>Vth</td><td>Threshold voltage is defined as the minimum gate electrode bias required to strongly invert the surface under the poly and to form a conducting channel between the source and the drain regions. It can be calculated on Id-Vg curves.</td></tr><tr><td>GM(MAX)</td><td>Transconductance is a measure of the sensitivity of the drain current to changes in the gate-source bias. It is influenced by gate width, which increases in proportion to the active area as cell density increases. It can be calculated on Id-Vg curves.</td></tr><tr><td>ID(SAT)</td><td>For a constant gate voltage (Vg), this computes the drain saturation current on Id-Vd curves.</td></tr><tr><td>ID(OFF)</td><td>For a constant drain voltage (Vd) and a gate voltage (Vg) equal to zero, this computes the leakage drain current on Id-Vg curves.</td></tr><tr><td>Rout</td><td>Rout is the value of the output resistance in the saturation region when Vg &gt; Vth. This value can be calculated on Id-Vd curves.</td></tr><tr><td>Ron</td><td>Ron is the value of the on-state resistance. It is calculated when the transistor is in the linear region. This value can be calculated on Id-Vd curves.</td></tr></table>

For more information about the extraction formulas used to obtain results in the analysis tool, see Inspect User Guide, Chapter 8.

# Exporting Data From Variables and Curves

You can export data from variables to a .csv file and data from curves to a .csv or .plx file, to allow the use of other tools for further analysis and plotting.

To export data from a variable or curve:

1. Select an xy plot.   
2. Choose Data $>$ Export XY Data, or click the toolbar button.

The Export XY Data dialog box is displayed.

3. Select the variables or curves to export by clicking the relevant tab.

![](images/a48bbe2c50352ead41baac1062ddc7bef4e2554866b445bcf8c262a0a7b46b40.jpg)

4. Export all variables (click the >> button), or export only the variables you need (click the > button) to the Variables to Export pane.   
5. Define the order of variables or curves in the export list using the Move Up or Move Down buttons to the right of the Variables to Export pane.   
6. Click Export.   
7. In the dialog box that opens, select the file format in which to export the data.

# Chapter 3: Working With XY Plots Exporting Data From Variables and Curves

# Note:

The precision of the data exported can be changed in the User Preferences dialog box (expand Application $>$ Common and, under Export, specify the precision).

When you export 1D plot variables to a .csv file, Sentaurus Visual might add a row to the file. The data in this row is only used internally. This additional row is always the second row and contains only none and SELECTED values. You can delete this row.

# 4

# 4Working With 2D and 3D Plots

This chapter presents specific topics about working with 2D and 3D plots in Sentaurus Visual.

# Visualizing 2D and 3D Plots

Sentaurus Visual can visualize simulation results for 2D and 3D plots. When a 2D or 3D file is loaded, Sentaurus Visual automatically generates a plot with the edge, field, and bulk layers activated by default as shown in Figure 43.

![](images/8d2d9a12785078cf70257651b41f5c4ec0d10504fa5dc723ae71642e12e253fd.jpg)  
Figure 43 Example of 2D plot

# Changing Plot Properties

You can easily change the properties of the current active plot using the Plot Properties panel. The Main tab allows you to customize the plot title including text, font, and whether you want to include the file path. You can also show or hide the legend and grid (only for 2D plots).

![](images/e4629cd2351c1343ddd37474eb8c186f975075159e3d31aa2817edd7dc558483.jpg)  
Figure 44 Main tab for (left) 2D plots and (right) 3D plots

![](images/7aa4f5015111aff6526e1bbe563420c9423b87eabf2b09387c5790f85524bf73.jpg)

The Axes tab allows you to show or hide the axes, to interchange the axes (only for 2D plots), and to show or hide the cube axes (only for 3D plots).

![](images/a1fcb7b49c1003481dd991c0550ea35ee7490a10b6d3ef7d0a6caa71a30782b2.jpg)  
Figure 45 Axes tab for (left) 2D plots and (right) 3D plots

![](images/f7a49862c955024c91a17ac6eed1ad5226aa237b24cc46ca149141401d26ebd7.jpg)

The Colors tab allows you to change the background and foreground colors of plots. The Palette tab allows you to select the color scheme to use for contouring and materials.

![](images/61c16060349e83537789474bc2d16b0b6441edf5eaaa70b3957a0ce23d171c65.jpg)  
Figure 46 (Left) Colors tab and (right) Palette tab for 2D and 3D plots

For 2D plots, the Scaling tab lets you change the x-to-y ratio. For 3D plots, this tab lets you scale plot axes.

![](images/5f8ebdbedfd45294c8e40123ce785d4740915cd1cfad86ff5e9544cbc60b7e8b.jpg)  
Figure 47 Scaling tab for (left) 2D plots and (right) 3D plots

The Contacts tab lets you customize the behavior of the contact color by selecting the behavior from the list.

![](images/aeb2a5573efed264a0bd12e3428730edb09bbd8088a749240b97b1fddc3bc83b.jpg)  
Figure 48 Contacts tab for 2D and 3D plots

The Markers tab lets you display a location marker for minimum and maximum values.

![](images/d5b6f0b51e51fe8d47de55480588a65669097fc6977ab8ef564bff077c798159.jpg)  
Figure 49 Markers tab for 2D and 3D plots

For 2D plots only, the Grid tab allows you to customize the color and width of grid lines.

![](images/ea4749f9e6837fe926e88a78a2aaa8cd3bf0f355074534cb7c4400ce64c9ef92.jpg)  
Figure 50 Grid tab for 2D plots

# Changing the Color Scheme for Materials

You can change the color scheme for materials by using the User Preferences dialog box. This selection is used as the initial color scheme for materials shown in all plots. However, you can change the color scheme independently in each plot using the Plot Properties panel.

# Note:

When you change the color scheme, you overwrite any custom colors used for the materials.

To change the color scheme:

1. Choose Edit $>$ Preferences.   
2. In the User Preferences dialog box, expand 2D/3D $>$ Plot.

![](images/293330d42b4e7d8f97c3d56d1eb9c816d55e0944dede0e7299eebae4eb2d4d92.jpg)

3. From the Material Color Scheme list, select Classic Colors or Vivid Colors. The Classic color scheme is the one that has been traditionally used.   
4. Click Save.

To change the color scheme in a plot:

1. Select the plot.   
2. Open the Plot Properties panel.

![](images/79e2a50b76dcbb0201bc1356e426683aa122c96211a3113e35de37577932dd9e.jpg)

3. On the Palette tab, from the Material list, select Classic Colors or Vivid Colors.

![](images/bbc7bff5e460e981dba8ff852f483b1bd1d23840164d35a9576fa0df49588671.jpg)  
Figure 51 Comparison of (left) Classic color scheme and (right) Vivid color scheme

# Displaying Region or Material Names

You can display the names of regions or materials in 3D plots as floating captions next to each region. The exact location of each caption corresponds to the center of the bounding box surrounding each region, so the caption might lie outside the region for concave ones.

To show or hide region or material names, specify -show_caption or -hide_caption in the set_region_prop command (see set_region_prop on page 367).

To adjust the font size and leader visibility of the caption as well as whether region or material names are shown, use the caption-related arguments of the set_plot_prop command (see set_plot_prop on page 362).

![](images/ef80793c1d22f7ea424cb02214df84fb06d1a45e6a77435659cd0b984624e412.jpg)  
Figure 52 Region captions over a translucent structure

# Visualizing Fields

The active field to be visualized in a plot can be chosen in the Data Selection panel (see Figure 53). The fields can be either scalar or vector. For scalar fields, you can choose the number of colors in which the visualization will be divided as well as the scale, which can be linear, logarithmic, hyperbolic arcsine (Asinh), logarithmic of the absolute (LogAbs), or some custom list of points that you define. Interface and particle fields are on separate tabs from scalar fields.

![](images/93ab5f7c8b5ef765241197f7533d3d8ab227d63758231ec0cf7532634ed9d08b.jpg)  
Figure 53 Data Selection panel showing options for visualizing fields

![](images/99abae7a4c9f6eb6eb4d8907bb684560b91d46476eca12bfdffb5193009bca52.jpg)  
Figure 54 Scale options for field visualization: (upper left) linear scale, (upper right) logarithmic scale, (lower left) Asinh, and (lower right) LogAbs

![](images/757676e17eb1b9a8bf570ab632e8d63b357d3cc0a4a8df9866806dc23ebd684f.jpg)

![](images/7f00811260eb5ed560d33eba64789e73d476acd6613c18da3f4c1f1a500f98d3.jpg)

![](images/21a786d6a073c767bdb5442a5b66fa6677842d63bc63925e97f6357ec35d6366.jpg)

# Visualizing Fields Defined on Interface Regions

Structures can have fields defined on interface regions. These fields are distinguished from regular region fields by the prefix Int(field name). For example, the name of the field DopingConcentration would change to Int(DopingConcentration). The prefix allows you to easily identify such fields on the Scalars tab of the Data Selection panel.

For 2D plots, the width of the interface increases automatically to improve visualization of the field data (see Figure 55 (right)).

![](images/57a2e2cc55b6dfef0f8be6986fc60f146a28774037bb60922cc165d425e9b61e.jpg)  
Figure 55 Interface data displayed in 2D plots for: (left) regular region field and (right) field defined on interface region

![](images/a71995a565c573f952161e910cf0e1aa8307e310b3ff59a05c879d435102da05.jpg)

![](images/1440a66b11fe52b17c06d720a0b0c482c4d0c05edb0faeada0061d5ccee8fbef.jpg)  
Figure 56 Interface data displayed in 3D plots for: (left) regular region field and (right) field defined on interface region

![](images/1e460bcb94c3377effefd61fe2216dae2b01b88e5e7f57413750a7142b937a70.jpg)

# Note:

When rendering 3D plots, you can observe the stitching phenomenon. It occurs when interface regions share their points with other regions. Both these types of region consist of coplanar polygons where two faces occupy essentially the same space, but neither is in front of the other. The result is a visible flickering as affected pixels are rendered from one polygon and then another polygon randomly.

For this reason, when working with 3D plots, you must switch on translucency of other regions to minimize the flickering effect.

# Visualizing Automatically Generated Regions

You can visual junction lines and depletion regions.

# Junction Lines

Sentaurus Visual calculates automatically the junction line in semiconductor regions where the Doping field is present.

The junction line is visualized as a dark-red contour line and is defined where Doping (DopingConcentration or NetActive) is equal to zero (Doping $= 0$ ).

# Depletion Regions

Sentaurus Visual calculates automatically the depletion region in semiconductor regions where the Doping field (DopingConcentration or NetActive) and the electron and hole density fields (eDensity and hDensity, respectively) are present.

The edge of the depletion region is visualized as a white contour line. The depletion region is defined by:

$$
n \cdot \frac {\mathrm {e D e n s i t y}}{\mathrm {D o p i n g}} - p \cdot \frac {\mathrm {h D e n s i t y}}{\mathrm {D o p i n g}} = \text {D e p l e t i o n E d g e V a l u e}
$$

where:

$$
n = \max  \left(\frac {\text {D o p i n g}}{\text {a b s} (\text {D o p i n g}) + 1}, 0\right)
$$

$$
p = \max  \left(\frac {- \mathrm {D o p i n g}}{\mathrm {a b s} (\mathrm {D o p i n g}) + 1}, 0\right)
$$

The DepletionEdgeValue is equal to 0.05 by default. You can modify this value by changing the Sentaurus Visual configuration file (~/.config/Synopsys/SVisual.conf).

The parameter that defines the DepletionEdgeValue is called depletion\edgeValue and belongs to the PlotHD group:

...   
[PlotHD]   
...   
depletion\edgeValue $\equiv 0$ .05   
.

# Visualizing Multiple TDR States

TDR files can contain multiple states of different simulation results from Sentaurus Process Kinetic Monte Carlo simulations or Sentaurus Device simulations. The states are related with regard to geometry. In other words, the main structure data and regions are maintained in all states but their field data changes. Sentaurus Visual allows you to visualize all the states.

For 2D and 3D plots that are generated from TDR files with multiple states, a navigation area specific to such plots is displayed to allow you to easily navigate through them (see Figure 57).

![](images/015096b4583ccd9db4bf2d2078c6a119aa96cae4463bb7a136a42140faf12afe.jpg)  
Figure 57 Navigation area for 2D and 3D plots generated from TDR file containing multiple states

The navigation area allows you to switch between displayed states quickly with the:

• Next State button   
• Previous State button   
• First State button   
• Last State button

With any change to the state index, the plot title will be updated to show the current state name.

In addition, the Play button allows you to automatically go through all the states, with a 1 second delay between changes, in ascending order. If the last state is reached and the Play button is still active, the sequence will restart.

Fields that are not present on the current selected state are not available in the Data Selection panel and cannot be selected. The plot renders only the corresponding selected fields for that state.

![](images/4d7f4799dab96d5e18f2d626109625d4057f12322aca373be05e0a1ce812dd0f.jpg)  
Figure 58 Data Selection panel showing unavailable field on Scalars tab

The navigation area for 2D and 3D plots also has the Expand/Collapse States button that opens the Expand States dialog box where you can select the states to expand (see Figure 59):

• Click the $>$ button to add one state only.   
• Click the $<$ button to remove one state only.   
• Click the $\gg$ button to add all states.   
• Click the $< <$ button to remove all states.

![](images/ec0da1729677d7922eee786a7872c95df5bd61db3b5e33a3fa89cc2aa9be5928.jpg)  
Figure 59 Expand States dialog box

When you click the Expand button in the dialog box, all the selected states are expanded to separate plots, so that you can analyze each state one by one (see Figure 60).

If you click the Expand/Collapse States button again in any expanded plot or the parent plot, all of the expanded plots will collapse, but not the parent plot.

# Chapter 4: Working With 2D and 3D Plots

Visualizing 2D and 3D Plots

![](images/5fc0f69bde70f6a7df077d01fdb50fdff0a80296a4fe8a6c9d302bccfdc17edf.jpg)  
Figure 60   
Example of 3D kinetic Monte Carlo TDR file expanded to show the same structure with changes to the state over time

![](images/af200257147115d2029d29a4f2a45c721c203f15d9e4aee498db83406ec30a99.jpg)

![](images/1bddffa3c5bb835f3f7953bbcc0640ac348216c47d45308576fde84272145acc.jpg)

![](images/c7d0af936ba89b359f922c326cbd48f93cf11b30c8b6cf15b536fcbe6e0131c0.jpg)  
Such plots can also have different field data for each state. Switching states or expanding plots can help you to visualize data (see Figure 61).

![](images/1236bcf54b5375ee5f6ed05c68c50e2abc7c46d1b426ac2a62f8dfb01cd4a33a.jpg)  
Figure 61 Example of multistate TDR file that has been expanded to show field data as separate plots

![](images/5fd3cd7191cd7b2c41177d4f652ca77708c486c913c5d098704c9a384726c02e.jpg)

![](images/bc2c4f5b034925a48c3579851db206e206ea816e040e47b11629a8e371b1fd36.jpg)

![](images/0be2349508af50a8d5661f3edd2e56e6fd64cb8bcc4eede4360e87de5593af18.jpg)

# Visualizing Regions With Multiple Parts

Some boundary structures, mainly originating from Sentaurus Topography 3D simulations, can contain regions with multiple parts. Sentaurus Visual can visualize and manipulate these parts independently.

When you load a TDR file from the command line, Sentaurus Workbench, or the user interface using the File Open dialog box, you can select an option to display parts individually. However, if you load a TDR file using Sentaurus Visual Tcl commands, you can display parts individually using the -parts option (see load_file on page 318 and load_file_datasets on page 319).

To visualize regions with multiple parts:

1. Choose Edit $>$ Preferences.   
2. In the User Preferences dialog box, expand 2D/3D $>$ Plot.   
3. Select Display and Control Parts Independently.

![](images/a589018ac0f728e2a0be9c5c25a941da3e77657517f3a3dafd533d66ff8ea109.jpg)

# 4. Click Save.

# Note:

If a TDR file is loaded with this option selected, field data is not loaded for regions with multiple parts.

The Regions tab and the Lines/Particles tab of the Data Selection panel show the hierarchy of regions and parts. All parts are shown under the parent region. Therefore, if you modify a property of the parent region (such as visibility), all its parts are also modified (see Figure 62 on page 117).

Regions tab showing (left) no regions with parts, (middle) one region (region_4) with parts, and (right) region with parts expanded

![](images/07f671ecdb6d9d9a2fff3d22dcd9d0364dce36e1f82f0bcae4b816aeb7a2b1f2.jpg)  
Figure 62

![](images/46bfd4503ad9c19cd3fee6f19cd9a5d7107b6b5c8a748d6f8f7a1602b6b06826.jpg)

![](images/f1de804747a8351da4ef0bcf206315ae3518428ed6f052cdd853d6a374fc5794.jpg)

# Visualizing Discrete Traps

You can visualize discrete traps as particles and visualize scalar fields as the color of the particles. Scalar fields and particle fields are on separate tabs (see Figure 63).

Regions of particles (blue box) and fields of particles (red box)

![](images/512eadc8c3c886be2448ecf66c4c5dc8d4204485966c926a66704acb93b2a4ab.jpg)  
Figure 63

Discrete traps are displayed as spheres of an initial size defined in the User Preferences dialog box. However, you can change the size by using the Region Properties dialog box.

To change the initial size of spheres:

1. Choose Edit $>$ Preferences.   
2. In the User Preferences dialog box, expand 2D/3D $>$ Plot.   
3. Under Particles, from the Initial Sphere Size list, select the value.   
4. Click Save.

To change the size of spheres in a plot:

1. Select the plot.   
2. Choose Data $>$ Region Properties, or click the toolbar button. The Region Properties dialog box opens.

3. Select Lines/Particles.

![](images/b50d483c25843baab0dd4dccb4169b34c2bd11d22c97e855c41487af9cb6b41e.jpg)

4. Under the Particle Size column, change the values as required.   
5. Click Close.

Figure 64 illustrates changing the sphere size of discrete traps.

![](images/13ab7fbeb4e2b951530f69687b8f35e20fd8a4dae47a3964cd10a725afdab00a.jpg)  
Figure 64 Visualizing the scalar field Occupancy

# 3D View

The 3D view is described by the position and the orientation of the camera in the world coordinate system.

The orientation of the camera is described by the vector formed between its position and focal point. This vector is called the direction of propagation. Initially, the center of the structure is located at the focal point.

The position can be described in a spherical coordinate system by the distance between the center of the camera and the focal point, also known as the depth distance, and two angles (azimuth and elevation).

The camera has its own coordinate system that is defined by three vectors: the view up, the direction of propagation, and the horizontal vector.

![](images/e314c0a5db3f11a81cd1bdcd85b32c5b682fa69760be93dd59ee5e57792b91de.jpg)  
Figure 65 Description of parameters used to define camera position

The view is defined by the view angle of the camera and the location of the focal plane, which is the plane defined by the focal point and the view up vector. The projection of this plane in the screen will be the view observed. Figure 66 shows the variables that describe the camera and the final view given by these variables.

![](images/2167fe4c2c5e9ca9983bacefa80b5dabed2a5fce71cfdb2f9f24560f28bed0c5.jpg)  
Figure 66 Camera properties: (left) perspective view, (upper right) horizontal view, and (lower right) vertical view

# Interacting With 3D Plots

While a 3D plot is active, you can interact directly with the camera.

Using the Select/Rotate tool $\textcircled { \scriptsize { 1 } }$ and dragging, you can rotate the view in relation to the rotation center using the default rotation mode.

Using the Spherical Rotation tool $\Subset$ and dragging, you can perform a spherical rotation of the view. Originally, the rotation center is the same as the focal center and can be changed by pressing the O key (lowercase character). The rotation transformation changes the azimuth and the elevation angles (taking the rotation center as reference), thereby maintaining the distance from the origin constant. In addition, you can rotate the plot more accurately in each angle by choosing View $>$ Rotate or using the rotate_plot command. You can specify the use of either the x-, y-, and z-coordinates, or the psi, theta, and alpha spherical coordinates (see rotate_plot on page 336).

In the same way, by right-clicking, you can change the position of the camera and its focal point in the plane perpendicular to the direction of propagation, keeping the direction of propagation and the depth distance constant.

![](images/dc60273e97d76426d0ea2c653a0e3c15ab5a9c2a33948091d96e5ccbf707c10b.jpg)  
Figure 67 (Left) Rotation of axes in relation to rotation center and (right) spherical rotation

![](images/5b44c09d8b1234ae5d16eb9b760c3299f0ebff2a5ebaced2a338ae1655f6a097.jpg)

You can also zoom in to the plot, changing the depth distance using the mouse wheel.

Furthermore, with the zoom_plot command, you can specify a factor to change the view angle of the camera (see zoom_plot on page 386). The factor given to the command is multiplied by the view up vector (the reflection of the view angle in the focal plane), resulting in zooming in when the factor is greater than 1 and zooming out when it is less than 1.

In addition, you can change the position of the camera and its focal point, in the world coordinate system, in the Camera Properties panel (choose View $>$ Camera Configuration). See Editing Camera Properties on page 122.

You can change the projection mode to a parallel projection, rather than a perspective projection, by any of the following methods:

Set the -parallel option of the set_camera_prop command (see set_camera_prop on page 344).   
Choose View $>$ Camera Configuration. In the Camera Properties panel, click the More tab. Under Projection, select Parallel (see Figure 68 on page 123).   
Choose Edit $>$ Preferences. In the User Preferences dialog box, expand 2D/3D > Rendering. Under Projection, select Parallel. Click Save.

The term parallel projection means that the lines of sight from an object to the projection plane are parallel to each other. Lines that are parallel in 3D space remain parallel in the 2D projected image. In addition, parallel projection corresponds to a perspective projection with an infinite focal length, that is, the distance from the lens of a camera to the focal point.

# Editing Camera Properties

When visualizing 3D structures, you can query and edit camera properties in the Camera Properties panel. To open the panel, choose View $>$ Camera Configuration.

The tabs of the Camera Properties panel are as follows:

• The Position tab allows you to modify the position and the focal point of the camera.   
The Rotation Point tab allows you to set the properties of the rotation point (see Rotation Point on page 146).   
The More tab allows you to configure the view up and the view angle. You can also select the type of projection as well as whether to use the dolly zoom.

The Perspective projection is the default and helps to visualize objects as they are seen in real life: near objects look bigger than distant objects. When using Parallel projection, the sizes of objects are proportional to their real sizes, so distance does not affect the final visualization.

The Dolly Zoom option is available only for perspective projection. By default, this option is not selected, which means zoom operations are performed by modifying the view angle. When you select this option, the camera moves towards and away from the focal point of an object.

# Note:

When you select the Dolly Zoom option, the camera might move inside visualized objects.

# Chapter 4: Working With 2D and 3D Plots

Visualizing 2D and 3D Plots

![](images/91f6266b161ae6b241a3c45f0a437f5e75ec1de81de075d5f027cae8d3141075.jpg)  
Figure 68 Camera Properties panel: (left) Position tab and (right) More tab

![](images/e452696d24b406c517fa02ef4a9af2da68cda48caf42074d827b45f0130d5c28.jpg)

# 2D View

The visualization of a 2D plot is described by the same camera values as the 3D visualization, but the difference is that, in a 2D view, the direction of propagation never changes, thereby maintaining constant azimuth and elevation angles.

# Interacting With 2D Plots

Dragging across a plot changes the position of the camera and its focal point in the plane perpendicular to the direction of propagation, which is the same plane for 2D plots.

Using the mouse wheel changes the depth distance from the focal point, zooming in to and zooming out of the plot.

# Light Kit

To provide clear visualization of 3D structures, Sentaurus Visual uses a light kit instead of a single light source. The light kit consists of the following different light sources (see Figure 69):

A key light, which is the main light source, represents the sun or a ceiling light. It is located in front of the displayed structure, above the camera, and displaced slightly to the right.   
• A fill light, which represents ambient light, is located in front of the displayed structure and under the key light.   
• A head light is located in the same place as the camera.   
Two back lights, located behind the displayed structure, are evenly spaced from the vertical center.

![](images/a041b537f072bfe79748fbedd106d626937f0a730f6631e7782aac684b66f6f6.jpg)  
Figure 69 Light kit illustrating different light sources

# Chapter 4: Working With 2D and 3D Plots

Visualizing 2D and 3D Plots

The light kit is designed so that the key light is the brightest reference for all the other light sources, whose intensity can be adjusted directly. For the other light sources (head, fill, and back lights), the Key Ratio parameter can be adjusted, which represents the relative intensity of the key light to each of the other lights (default ratio is 1:3).

The position of the key, fill, and back light sources can be adjusted by changing the elevation and azimuth (latitude and longitude) with respect to the origin of the coordinate system. Due to its nature, the head light is always located at zero elevation and azimuth.

![](images/74b478427878fcefce9f8d3e9aec57fe69837661d2eecd21770368a636fdfd98.jpg)  
Figure 70 Elevation and azimuth around the structure

Besides position, the warmth of the light sources can be adjusted from 0.0 to 1.0, where 0.0 represents a cold blue-tinted light and 1.0 represents a warm red-tinted light. Values around 0.5 provide white light.

![](images/97e6d23eb9c7d8b7ca4b13ff1fa2197de485e7c6dc9d95ae3027d9dd22300abf.jpg)  
Figure 71 Warmth range

# Editing the Properties of Lights

You can edit the properties of the different light sources in the Lights Properties panel. To open the panel, choose View $>$ Lights Configuration.

The tabs of the Lights Properties panel (see Figure 72) are each linked to one of the light sources of the light kit. You can adjust the following parameters:

• Warmth [0.0, 1.0]: Color temperature   
• Intensity [0.0, 1.0]: Intensity of the key light   
Key Ratio [0, 99]: Relative intensity of the key light to the head, fill, and back lights (default ratio is 1:3)   
• Elevation [-180°, 180°]: Latitude of the light source   
• Azimuth $[ - 1 8 0 ^ { \circ } , 1 8 0 ^ { \circ } ]$ : Longitude of the light source

The Reset button is used to reset the parameters of all lights to their default values.

![](images/86a1f6030c76a1d80a00911f7cd10645820a4f97e60426c585cef941c5d3ccf5.jpg)  
Figure 72 Tabs of Lights Properties panel

![](images/e2350320e51b2ebdad458e795d8f603b58a88b71fc3c7a01aa9c8920de916a3a.jpg)

![](images/20f69a198c5dddc4bebc8b84ceb4337ea519140f610704baf94ff9a18415938d.jpg)

![](images/a5a8d931e143d544eb23dc709d7bb18eb8cf453c5c05149626dbcef5c7042fca.jpg)

# Loading Options for Data

Sentaurus Visual provides options that allow you to omit some data from loading (only for 2D and 3D TDR files), to reduce the loading time and memory consumption:

You can clear the Load Interfaces option to not load interfaces. Some TDR files can have a large amount of data about interfaces, and not loading this data reduces the loading time. By default, Sentaurus Visual loads interfaces. If you clear this option, the data fields located on interfaces are also not read.   
The Load Selected Fields option allows you to load only certain fields. Some simulations generate a long list of fields, but you might want to view or analyze only a few fields. This option reduces the loading time and memory consumption. You can load only a selected list of field names. The filtering works with wildcards (such as * and ?), making selection of the list simpler. For example, by adding the element Net*, Sentaurus Visual will load the NetActive and NetDoping fields, if they exist. By default, Sentaurus Visual loads all fields.   
The On Demand option allows you to load fields only when needed. This option greatly reduces loading time and memory consumption. Fields that are not loaded are shown in italics in the Data Selection panel. The field is loaded when you change the rendering option of that field (see Rendering Options on page 129).

The In Background option allows fields to be loaded automatically in the background after the TDR file has been opened. You can select this option only if the On Demand option is selected.

# Note:

These loading options work only with TDR files version 17. This version implements a new optimized data and file format, which improves the Sentaurus Visual loading time significantly. In addition to loading on demand, data is read using multiple threads.

In the Sentaurus Visual configuration file ( $[ \sim /$ .config/Synopsys/SVisual.conf), you can prevent some fields from being loaded and shown at interfaces, while still allowing them in bulk regions. To configure this option, edit the interfaces\blockSpecificFields entry in the PlotHD group and list the fields to be blocked. For example:

interfaces\blockSpecificFields $\equiv$ Arsenic, As3, Boron, BTotal

The loading options work as set up in the User Preferences dialog box, unless you execute Sentaurus Visual with the -alldata command-line option to overwrite the settings. When you use -alldata, the -alldata option is added to the Tcl commands related to loading and reloading files, so that you can set the condition explicitly if needed. However, the -alldata option of these commands always overwrites the user preference settings,

meaning all data is loaded. See load_file on page 318, load_file_datasets on page 319, reload_datasets on page 326, and reload_files on page 326.

To change loading options for data:

# 1. Choose Edit $>$ Preferences.

The User Preferences dialog box opens.

![](images/c54ed48f00e2fe4efd4db7a0bf6f4e7496f48f96dde81fffad9178af00db9a56.jpg)

# 2. Expand 2D/3D $>$ Loading.

The Load Interfaces option is selected by default.

# 3. Select Load Selected Fields if required.

4. Perform any of the following operations:

◦ To remove a field, select a field and click Remove.

The list is updated without the field.

◦ To modify a field, double-click a field, change its name, and press the Enter key.

◦ To add a field, click Add.

A new field name is added to the end of the list. Double-click the field, change its name, and press the Enter key.

# 5. Click Save.

# Rendering Options

Two-dimensional or 3D plots are composed of materials that are distributed in regions with properties defined in contour maps (scalars, interfaces, and particles) or flux lines (vectors). All these properties can be found on the Data Selection panel (see Figure 73).

![](images/c0628400c07229761b3f7f896f0bc87e1b5f9f7ac57b85ab59daaf30606ad8b6.jpg)  
Figure 73 Data Selection panel showing materials and scalar properties

# Materials and Regions

The materials and regions of which a plot is composed are shown in the upper part of Figure 73.

# Note:

Clicking the Name column heading of the Data Selection panel sorts the elements, by cycling through unsorted, then alphabetical ascending order, and then alphabetical descending order.

Double-clicking a cell of a structure in the plot area highlights the region or material to which that cell belongs in the Data Selection panel.

Table 7 Icons relevant for materials and regions   

<table><tr><td>Icon</td><td>Description</td></tr><tr><td></td><td>Shows or hides the material or region completely. If deactivated, it hides the bulk, contour fields, mesh, borders, and vector fields independent of their state.</td></tr><tr><td></td><td>Shows or hides the bulk.</td></tr><tr><td></td><td>Shows or hides the contour fields.</td></tr><tr><td></td><td>Shows or hides the mesh.</td></tr><tr><td></td><td>Shows or hides the borders.</td></tr><tr><td></td><td>Switches translucency on or off.</td></tr><tr><td></td><td>Shows or hides the vector fields.</td></tr></table>

# Showing or Hiding Properties for Multiple Materials and Regions

Clicking a check box next to a material or region shows or hides that specific property only for that region or material.

# Note:

You can select multiple rows of materials or regions by dragging the cursor, or holding the Ctrl key or the Shift key while selecting rows in the Data Selection panel.

If you select multiple rows of materials or regions, when you click an icon itself, it shows or hides that specific property only for all the selected materials or regions.

If no materials or regions are selected, clicking an icon affects all materials or regions. These operations are immediately shown in the plot area.

# Modifying Properties in Multiple Materials and Regions

Sentaurus Visual provides a dialog box where you can modify all properties in several regions, particles, or materials at the same time (see Figure 74).

To modify multiple regions:

1. Choose Data $>$ Region Properties, or click the toolbar button.   
2. Select the required rows.   
3. Click the column header of the property you want to change.

A dialog box is displayed where you enter the value of the property.

However, if only one region needs to be modified, double-click the entry and type the new value to change the property.

![](images/6ef33c72e68076fac2218341485d9d2b4fbbd109117147c6998579572eb1f131.jpg)  
Figure 74 Region Properties dialog box

# Modifying the List of Initially Hidden Materials

Sentaurus Visual manages a list of materials that are not rendered when you open a new file. The following materials are not rendered by default:

Gas   
Vacuum   
• RefinementBox   
• JunctionLine   
• DepletionRegion   
• Interface

To modify the list of initially hidden materials:

1. Choose Edit $>$ Preferences.   
2. In the User Preferences dialog box, expand 2D/3D $>$ Materials.

![](images/56707d235745851b68797a832334e35a7197a0ee71ccdd192700ba5b77237264.jpg)

# Chapter 4: Working With 2D and 3D Plots Rendering Options

3. Perform any of the following operations:

◦ To remove a material, select a material and click Remove.   
◦ The list is updated without the material.   
◦ To modify a material, double-click a material, change its name, and press the Enter key.   
◦ To add a material, click Add. A new material name is added to the end of the list. Double-click the material, change its name, and press the Enter key.

# 4. Click Save.

# Contact Regions

The contact material and its regions can be colored in a special way defined in the User Preferences dialog box. This feature allows you to differentiate the contacts for better understanding of the types of region. Any change to the user preferences is applied to the next created plots. Nevertheless, the changes can be applied to the current plot using the Contacts tab of the Plot Properties panel.

In the User Preferences dialog box, expand 2D/3D $>$ Contacts. In the Contact Color Behavior box, select from one of the options:

• Constant Color   
• List Colors   
• Map Colors

The Constant Color option loads all the contacts with the same color as a configurable default value. Magenta is the default.

![](images/11f0798283e7f1ff4dfd53918f0f8e15ba8340aa188e0bbe01e1e4bec5e1f281.jpg)  
Figure 75 User Preferences dialog box showing selection of Constant Color

The List Colors option loads the contacts with a set of colors using round robin logic.

![](images/2300bc22418ac683a305521d707db1d7b2725f0d2fa7f284e08ee2f87abb2806.jpg)  
Figure 76 User Preferences dialog box showing selection of List Colors

The Map Colors option loads the specified contacts with the specified colors; otherwise, they are displayed with a constant color. The Contact Name column supports wildcards for reference contacts with common patterns in their names. This list is empty by default.

To apply changes to the user preferences without reloading a plot, use the Contacts tab of the Plot Properties panel to select the color behavior and to apply changes (see Figure 48 on page 102).

![](images/694850a4a65fe482d550f31491f9232bcd7251e086bdd941d78fcdb6a5b7c7d9.jpg)  
Figure 77 User Preferences dialog box showing selection of Map Colors

# Contour Plots

Scalar fields are used to generate contour plots. Usually, the contour levels are calculated automatically, so that they are distributed evenly within the value range of the active field.

# Contour Legend Settings

The properties of the legend of contour plots can be changed by double-clicking the legend.

The Legend Properties panel opens (see Figure 78) where you can:

• Customize the number, precision, and notation of the labels.   
• Enable a background for the legend.   
• Change the background color and the frame color.   
• Customize the font for the title and the labels.   
• Set the orientation of the legend.

![](images/9cbf31841e38b70a3408e9a40448837c4c719315eb119edc73e4131f7e2bc7e0.jpg)  
Figure 78 Legend Properties panel

The font size of the legend is related to the diagonal of the plot, and Sentaurus Visual internally sets a value so that the legend is visible in plots that are $6 0 0 \times 6 0 0$ pixels or larger.

To change this value, you must apply a font scale diagonal factor to the font base every time that you rescale a plot. You can do this with the -title_font_factor and -label_font_factor arguments of the set_legend_prop command to change the title and labels of the legend, respectively (see set_legend_prop on page 356).

In addition, you can set this factor in the User Preferences dialog box.

To set a new font scale diagonal factor:

1. Choose Edit $>$ Preferences.   
2. In the User Preferences dialog box, expand 2D/3D $>$ Legend.   
3. Under Fonts, click the button next to the Title Font or Label Font field.   
4. In the Font dialog box, set a font scale diagonal factor.

Values greater than 1.0 will increase the font size, and values less than 1.0 but greater than zero will decrease it.

5. Click OK to close the Font dialog box.   
6. Click Save.

# Displaying Contour Plots

To create a contour plot, select the required property to be plotted on the Scalars tab of the Data Selection panel (see Figure 73 on page 129). The range and levels are set automatically, but they can be customized using the Range and Levels tabs (see Figure 79), where you can manually define a range and the number of levels displayed.

![](images/73c05d45ae2f684cfd67f9dee7a761f32e5044bbb632f927194cce110f21c4de.jpg)  
Figure 79 Contour plot options showing the Range tab where the first field is the minimum value and the second field is the maximum value of the range

On the Lines tab, you can change the properties of the contour lines of the selected field, such as color and width, and then show several contour lines at the same time.

When a file is not a TDR file, all the default values for field scaling and field units are defined in the datexcodes.txt file for each field (see Utilities User Guide, Variables).

In the case of a TDR file, all field units shown are those contained in the TDR file. However, for field scaling, the values are obtained from the datexcodes.txt file.

Despite the input file format, if a field is defined (in the datexcodes.txt file) to be present in only one type of material (for example, semiconductor), no data is loaded or displayed for regions of a different material type.

Although only one field can be displayed using color-filled contour levels, you can display multiple contour lines from other fields by clicking the second column of the field list of the Data Selection panel (see Figure 73).

If a field unit has a question mark (?), it means the unit is undefined and, most likely, comes from an old file that you must update.

# Converting Data to Nodal

For element-type data, there is an option that interpolates element data to nodal data.

To convert data, select the Convert to Nodal option on the Levels tab of the Data Selection panel. Figure 80 shows the results of converting data to nodal. The converted data looks smoother.

In addition, in the User Preferences dialog box (expand 2D/3D $>$ Plot), the Convert Element To Nodal Data option is selected by default.

![](images/ecd280268ebdd87c67a7d63166a35e3208a290ad0034f361c1cbefb0a60cfd32.jpg)  
Figure 80 Comparison of (top) element-type data and (bottom) nodal-type data

![](images/c393c3de3a610c68a32b5ead0f712b9802a6c40c218058b0f07e5fab29208e5f.jpg)

# Creating New Scalar Fields

Custom scalar fields can be created on the More tab (see Figure 79 on page 138). When you click the Add Field button on this tab, a dialog box is displayed where you can create a custom field (see Figure 81). It allows insertion of functions and operators, and the use of existing fields.

![](images/16cc841d7d846c3dc49e686eb2b28983282dca420c9a24753047cf54367a2f2e.jpg)  
Figure 81 Create Numeric Field dialog box displaying fields, operators, and functions

# Vector Plots

To add a vector field to a plot, click the Vectors tab of the Data Selection panel. Select a check box next to a field to display it on the plot. Vector lines can be displayed uniformly or with a size proportional to the magnitude of the field.

Uniform scaling means that all vectors have the same size. The length of the arrow is the value of the scaling.

With the grid scaling option, the length of the arrow is given by the vector field magnitude (or the absolute value if required) multiplied by the scaling factor.

The default uniform value can be set in the User Preferences dialog box (expand 2D/3D > Fields). In the Vector group box, if no value is set, Sentaurus Visual uses 0.1 as the default.

![](images/9bc24e1aeab6feb20852678db802d217cbc0dda9f133023c174bfb8aaddc2b4d.jpg)  
Figure 82 (Left) Scaling options for vectors and (right) Head tab showing property options for arrowheads

![](images/bed1aa6f1b62ab88762bfdc1f94d2bd37156905e1af5bbb1b329c6a72898b76e.jpg)

# Chapter 4: Working With 2D and 3D Plots Importing an Image as a Background Field

The Head tab lists the properties of the arrowhead such as shape, size, angle, and color (only available when the shape selected is Arrow Solid or Head Solid).

The Constant option maintains the size of the arrowhead regardless of the zoom level or the vector length.

![](images/d47fdb0375d486897e1ac0ad1264ba8284353536c556b989ac0dfb069690acbd.jpg)  
Figure 83 Example of plotting a vector field

# Importing an Image as a Background Field

You can load an image file into Sentaurus Visual and use it as a background field.

To load an image:

1. Choose File $>$ Import Image.

The Import Image dialog box opens.

2. Click Browse and select the image, or enter the path to the image in the File Name field.

3. In the Name field, enter a name for the new dataset containing the image data.

![](images/299807e09cc16aaf645ba314c85b5027602773527f67534c2a80ed665fe9e581.jpg)

4. Select New Plot to create a new plot containing the dataset.

If this option is not selected, then the dataset will be overlaid onto the active plot.

5. Click OK.

Alternatively, you can load an image using the load_file and overlay_plots Tcl commands. For example:

```txt
% load_file "pic.png"
% overlay_plots {Plot_2D} -datasets {pic} 
```

See load_file on page 318 and overlay_plots on page 323.

# Adjusting Magnification of an Image

After an image is loaded and overlaid onto a plot, you can adjust the magnification to a specific area in the image.

To adjust the magnification of an image:

1. Choose View $>$ Scale to Image.

The Scale to Image dialog box opens.

![](images/537ebfed3a8b2ca6c0d95a2262f69f59c649c7186731a78041236a9c2d8d71c7.jpg)

2. Specify two points of the screen: the first is the x-coordinate and the second is the y-coordinate.   
3. In the Scale field, specify the length and unit that will be the scale used for the distance between the two points.   
4. Click Apply.

![](images/679a3121dfc4aada98a866649687b8a287c797853228a1b61a75c43f4743b600.jpg)  
Figure 84 Example of a plot with an overlaid image

# Visualizing Point Boundary Conditions

You can visualize point boundary conditions from Sentaurus Interconnect. Such visualization is switched off by default and is activated by setting

main\loadPointBoundaries $=$ true in the PlotHD section of the SVisual.conf file.

Zero point displacement rates are displayed as gray cones pointing to the specific location, while point force conditions are displayed as gray arrows.

![](images/f88d2f961ed462ff3450eb912c332430b6f43bfce37786d86dcbb13e6fcd2d66.jpg)  
Figure 85 (Left) Zero point displacement rate and (right) point force condition

![](images/e44ea11fa546a3e37633bf15173ee10e60576150f7483bad55e531e137e56afc.jpg)

# Scaling and Shifting 2D and 3D Geometries

Sentaurus Visual can transform the geometry of 2D and 3D geometries, and change how they are visualized in a plot. Two geometric transformations are available: scale and shift.

# Note:

These transformations affect only the visualization of data, not the original geometry data.

To scale or shift a geometry:

1. Choose Tools $>$ Transformation.

The Transformation dialog box opens.

2. Change the scale and shift values for each axis for a certain geometry.

![](images/63cd116d3717fc657fffbe1e056e2814958132806971ff5b61ca60f9547aa54d.jpg)

# 3. Click Apply.

# Rotating Structures (3D Plots Only)

Three-dimensional plots can be rotated freely over a rotation point or fixed to an axis.

To rotate a plot, you must be in selection mode (click the $\nwarrow$ toolbar button). Drag to rotate the plot. When you release the mouse button, the rotation stops.

To set the origin of a rotation point, use the camera configuration by either choosing View > Camera Configuration or placing the cursor on the required point and pressing the O key.

Table 8 Rotation modes   

<table><tr><td>ToolBar button</td><td>Shortcut keys</td><td>Description</td></tr><tr><td></td><td>Press the N key while dragging the cursor.</td><td>Enables standard rotation until you release the N key.</td></tr><tr><td></td><td>Press the S key while dragging the cursor.</td><td>Enables spherical rotation until you release the S key.</td></tr><tr><td></td><td>Press the X key while dragging the cursor.</td><td>Fixes the rotation around the x-axis until you release the X key.</td></tr><tr><td></td><td>Press the Y key while dragging the cursor.</td><td>Fixes the rotation around the y-axis until you release the Y key.</td></tr><tr><td></td><td>Press the Z key while dragging the cursor.</td><td>Fixes the rotation around the z-axis until you release the Z key.</td></tr></table>

# Rotation Point

The rotation point is the reference location for free rotation, that is, when not rotating around an axis. Default coordinates are calculated for every plot, locating the rotation point in the center of the initial visible structure. The same rotation point also is used in Spherical Rotation mode.

The rotation-point coordinates can be changed along with the properties of the rotation point by using either:

The menu bar (choose View $>$ Camera Configuration and, in the Camera Properties panel, click the Rotation Point tab)   
• The set_camera_prop command (see set_camera_prop on page 344)

![](images/128464b98b1829b5b39a5798295f0d48a950dd78f84e9c85134d17c37284c6dd.jpg)  
Figure 86 (Left) Three-dimensional structure showing the default rotation point (translucency activated) and (right) the Rotation Point tab in the Camera Properties panel

![](images/5db6e04b59324e919391feb6a6a3e394a122b9d06e53c29c3d5d1b6e88967c5e.jpg)

# Customizing the Rotation Point

The rotation point is visualized as a tiny sphere with axes crossing it over three dimensions. Moreover, the properties of the rotation point can be customized. Table 9 summarizes these properties.

Table 9 Properties of the rotation point that can be customized   

<table><tr><td>Property</td><td>Description</td><td>Tcl command example</td></tr><tr><td>Color</td><td>Determines the color of the rotation point when it is visible in &lt;#rrggb&gt; format.</td><td>set_camera_prop -rot_color #FF00FF</td></tr><tr><td>Size</td><td>Sets the length of the rotation point axes. The size is an integer.</td><td>set_camera_prop -rot_size 5</td></tr><tr><td>Width</td><td>Sets the thickness of the rotation point axes. The width is an integer.</td><td>set_camera_prop -rot_width 3</td></tr><tr><td>Visibility</td><td>Determines whether to show or hide the rotation point.</td><td>set_camera_prop -showRotation_point set-camera_prop -hideRotation_point</td></tr><tr><td>Position</td><td>Sets the location of the rotation point. The position is defined by three floating-point values.</td><td>setcamera_prop -rotation_point {0.0 1.0 -0.8}</td></tr></table>

# Using the Rotation Point as a Reference Point

The rotation point can be used as a reference point when inspecting 3D structures. As previously mentioned, you can move the rotation point to a specific position using either the user interface or the set_camera_prop command. Using the Tcl command, it is only possible to set the position by exact coordinates. For example:

set_camera_prop -rotation_point {0.0 1.0 -0.8}

Using the user interface, the position of the rotation point can be set by either exact coordinates or the cursor. In both cases, you must show the Rotation Point tab by choosing View $>$ Camera Configuration to display the Camera Properties panel. On the Rotation Point tab, the Position fields allow you to introduce the values of the x-axis, y-axis, and z-axis of the position. The position is updated every time you leave any of the fields or if you press the Return key.

# Chapter 4: Working With 2D and 3D Plots

# Rotating Structures (3D Plots Only)

Another option is to use the Set With Mouse button. To set the position of the rotation point with this feature:

# 1. Click Set With Mouse.

The button remains selected. Note that the cursor changes appearance to a cross when it hovers over the plot.   
2. Click the structure at the required location to set the position of the rotation point. Note that the point will be set at the surface of the structure.

After this, the Set With Mouse button is released, and the cursor returns to its previous state.

The rotation point is visible while the Set With Mouse button remains selected. Since the rotation point is in the inner part of the structure by default, it is not visible unless translucency is enabled or any region obstructing its view is hidden.

To make the rotation point permanently visible, select Show (see Figure 86 on page 146 (right)). Deselect the option to hide the rotation point.

# Note:

A shortcut exists to set the rotation point when using the Set With Mouse button: Hover the cursor in the required location over the structure and press the O key. This will set the position of the rotation point in the same way as the Set With Mouse button.

To set the rotation point inside the structure, you can either:

Set the rotation point on the surface and, then modify it by using the set_camera_prop command or by setting the values in the Position fields.   
• Hide regions or materials before setting the rotation point with the cursor.

# Note:

The position of the rotation point is constant with regard to deformation, value blanking, and other Sentaurus Visual features that alter the structure.

# Rotating Plots Using Exact Values

You can rotate 3D plots precisely using the Rotate dialog box (choose View $>$ Rotate) or the corresponding rotate_plot command (see rotate_plot on page 336).

The dialog box has the following tabs (see Figure 87 on page 149):

On the XYZ Axis tab, you can rotate the structure around the x-, y-, or z-axis using relative angles with a defined number of steps, or you can set absolute angles.

# Chapter 4: Working With 2D and 3D Plots Rotating Structures (3D Plots Only)

On the Spherical tab, you can rotate the structure using spherical coordinates (see 3D View on page 119 and Figure 67) with a defined number of steps, or you can change the angles directly.

The Step field applies to both tabs and is used to define the number of steps.

![](images/17473e6814d245e198a433b9a7cce9fc95af9f38e32521f3329ae064f9e3dc36.jpg)  
Figure 87 Rotate dialog box showing (left) XYZ Axis tab and (right) Spherical tab

![](images/e99956fa64bc7117c23ab4824d04b1dc278c8a700de240542af06c32807e698b.jpg)

The Planes group area is independent of the rotation mode. You can change the view of the structure to a specific plane using the View Plane XY, View Plane YZ, and View Plane XZ buttons, or you can rotate the structure $9 0 ^ { \circ }$ in different directions using the arrow buttons.

The rotations performed by the arrow buttons are equivalent to the rotations performed by mouse operations when the rotation mode is in its default state (see Figure 88):

The Left Arrow button and the Right Arrow button rotate the plot around an imaginary, completely vertical vector that is located at the rotation point of the plot.   
The Up Arrow button and the Down Arrow button rotate the plot around an imaginary, completely horizontal vector (perpendicular to the vertical vector) that is located at the rotation point of the plot.

You can use the arrow keys of the keyboard as shortcut keys to rotate the plot in the same way as the arrow buttons of the Rotate dialog box. This functionality is available when a 3D plot is selected or when the Rotate dialog box is open.

![](images/8954616372807859c9af0aa0bdea7939d6450549997480fb317f068f1f5b5ec4.jpg)  
Chapter 4: Working With 2D and 3D Plots Overlaying Plots   
Figure 88 Directions of rotation performed when using the arrow buttons

# Overlaying Plots

Overlaying 2D or 3D plots allows you to examine the differences between two similar plots.

To overlay plots:

1. Select two or more plots to be overlaid.   
2. Click the toolbar button.

A new plot is generated with the selected plot structures overlaid.

![](images/610ad7dcee442e0b774bd257e96548d6d7682adcead73f17e8bebf1929bdaa58.jpg)  
Figure 89 Example of overlaying plots

When plots are overlaid, the Data Selection panel changes to a tree view to allow for the visualization of different geometries as shown in Figure 90.

![](images/b623d9dcf7fd9fe2c56d2fb26fa95c70469e7cc65b119fe152474d92d65e6601.jpg)  
Figure 90 Data Selection panel showing tree view when plots are overlaid

The geometries can be easily distinguished by selecting different boundary or contour line colors.

To select a specific boundary line color:

1. On the Materials tab, double-click the filled rectangle preceding the geometry name.   
2. Choose a color from the list, and press the Enter key.

To select a specific contour line color:

1. On the Scalars tab, Interfaces tab, and Particles tab, double-click the filled rectangle preceding the geometry name.   
2. Choose a color from the list, and press the Enter key.

If you want to change the colors of specific materials or regions, you must use the Region Properties dialog box (press Ctrl+Shift+E). See Modifying Properties in Multiple Materials and Regions on page 131.

# Showing Differences Between Plots

Differentiating 2D or 3D plots allows you to determine differences in the common fields of two different plots. A new plot is generated showing the field differences between the two plots.

To differentiate plots:

1. Select two plots with common fields.   
2. Click the toolbar button.

# Note:

The objective of this functionality is to compare two similar plots. Therefore, a correct result is not guaranteed if the plots do not have the same number of regions with the same names. A warning message is displayed if there is a mismatch.

![](images/3935ad25bc62c1ff818aa280b1f035e15c782249a6b63fd9bddef2d89aa8fb2c.jpg)  
Figure 91 Example of a difference plot resulting from comparison of two plots

![](images/8bead0715ef605b3e09ef27f8af698ba625c993671b606df75bb93b15f0754a6.jpg)

![](images/7e5b4bdf057ffc4bf1b31f3cd0e4482dcb6c2be5c62bcc816189efd8ffd6bb8c.jpg)

# Measuring Distances

You can measure the distance between two points in a plane or in space for 2D and 3D plots.

To measure a distance in a plot:

1. Click the Ruler toolbar button.   
2. Drag from the starting point of the measurement.   
3. Release the mouse at the end point of the measurement.

# Note:

You also can create a new ruler by using the create_ruler command (see create_ruler on page 236.

# Chapter 4: Working With 2D and 3D Plots Measuring Distances

To modify the ruler:

1. Move the cursor over the start or end point.   
2. Click the point to select it.   
3. Drag the point.

# Note:

Holding the Alt key while dragging limits the movement horizontally or vertically only.

You also can modify a ruler by using set_ruler_prop command (see set_ruler_prop on page 369.

![](images/a59710817ab933ceffca4325d369b25ae13ec7e9aea2631a4723a0eae34e0abc.jpg)  
Figure 92 (Left) Selected point is highlighted and (right) dragging point

You can keep a selected ruler on screen and create a new one by clicking the $^ { + }$ tab on the Ruler panel. Each ruler has its own numbered tab and you can click tabs to move between rulers.

The Data tab of the Ruler panel shows the coordinates and distances calculated. Clicking the Remove button deletes the ruler from the plot and the Ruler panel (see Figure 93).

The Properties tab shows the ruler properties and provides a snap-to-nearest point function. When you select Snap to Mesh, Sentaurus Visual automatically selects the

nearest point in the grid to the one clicked when measuring distances. You can also change ruler properties by using set_ruler_prop on page 369.

While measuring distances, you can rotate a structure using any of the shortcut keys (see Rotating Structures (3D Plots Only) on page 145).

You can also choose the selection mode and rotate the structure (the ruler is permanent). In this mode, you cannot select the ruler until the ruler mode is reactivated.

![](images/680db364d7ef42a77d0c93f6e4d652b45d9320fddc42f813d64f9a5762e2267c.jpg)  
Figure 93 Ruler panel showing (left) Data tab and (right) Properties tab

![](images/42a24e834526b2e74fd83732d839147476513d18d18379723423b32a21b2faa6.jpg)

# Integration Tool

You can integrate the active field on all the materials of the current 2D or 3D plot.

To enable the integration tool, click the $\textstyle \int d r$ toolbar button.

The Field Integration dialog box is displayed (see Figure 94) with the results of the integration for each material and a total value calculated over the active field. Integration can be performed on other fields without changing the active field displayed on the structure.

Integration over the active field commences immediately, but it can be stopped by clicking the Cancel Integration button of the Field Integration dialog box.

Integration on large structures can take some time. To see the progress of the integration, a progress bar is visible in the lower-right corner of the user interface.

Field Integration dialog box showing (top) Domain tab, (lower left) Region/Material tab, and (lower right) Polygonal Domain tab

![](images/848b506b2bbacf99736a3f32fd7e258a4903e310e846ba54530d376704850a43.jpg)  
Figure 94

![](images/9ae4844a672f4fdc223941783e07bc50e3e63485af8bb2af5747b59677265884.jpg)

![](images/8c4500a7c328772258fbb37c96a9a678a3a6b70557f41c2819dc20063ca29f42.jpg)

# Using a Custom Integration Domain

Integration can be performed over the complete structure, inside a defined bounding box, or inside a defined polyhedron domain.

To use a bounding box:

1. In the Field Integration dialog box, on the Domain tab, deselect Complete Domain.   
2. Enter the custom ranges.   
3. Click Start Integration to obtain the updated value.

To use a polyhedron domain:

1. In the Field Integration dialog box, on the Polygonal Domain tab, select Polygonal Domain.   
2. Select X (default), Y, or Z as the extrusion axis.   
3. Define the polygon to be extruded.

You can add polygon points interactively using the Add by Click button or manually in the table. Click the Insert Row, Remove Row, or Reset buttons to adjust the table if necessary.   
4. Click Start Integration to obtain the updated value.

# Integrating Only a Defined Set of Regions or Materials

By default, integration is performed over all regions or materials of a structure. This can be changed on the Region/Material tab of the Field Integration dialog box by selecting only the regions or materials that you want to integrate, and then clicking Start Integration.

# Probing

For 2D and 3D plots, you can display information about a selected point on a structure.

To probe a point:

1. Click the toolbar button.   
2. Click the point to be evaluated.

The Probe panel opens, which shows various information about the point such as the values of all fields and information about the cell (see Figure 95 on page 158).

# Note:

If you hold the Ctrl key when you click the point to be evaluated, the cursor (crosshairs) snaps to the closest mesh point. The same is achieved by selecting Snap to Mesh on the Probe panel, which provides information about the closest edge to the probed point of the structure.

You can keep a selected point on screen and probe other points. Each point has its own numbered tab and you can click tabs to switch the active point and highlight the cursor (crosshairs) in the plot. In the Probe panel, you can click the Close All button on the first point tab to delete all points except the first one.

![](images/6f1437b53939f5527311079d486143b55d2987abc639a217bc39115be170b2b1.jpg)  
Figure 95 Probe panel

In addition, you can display information from different plot groups at the same time. However, only information that is available for all group members will be shown (see

Figure 96). If one member of the plot group does not have the same information as the plot group leader, it will show nan (not a number) as the current value. This feature is compatible with displaying multiple crosshairs (see Figure 97).

![](images/f55a4f97bf266832270ff29e60b4dcd5aa43c63841fcfe056db01c68e9e858fd.jpg)  
Figure 96 Probe panel showing multiple probe points on linked plots

![](images/e904d2f521781c53244591fc491a6ec47651ca103ac0e3edeae9237030a09eae.jpg)  
Chapter 4: Working With 2D and 3D Plots Probing   
Figure 97 Multiple crosshairs shown in different plot groups

![](images/20409218a1ed13e321337a17eb63d292c0c029ebf4b760c77867e550a90af3dd.jpg)

You can control the number of significant digits after a decimal point to be displayed. To specify the number of significant digits displayed after a decimal point:

1. Choose Edit $>$ Preferences.

The User Preferences dialog box opens.

2. Expand Application $>$ Common.   
3. Under Tcl, change the value of Precision.   
4. Click Save.

(Left) User Preferences dialog box with precision set to 4 and (right) Probe panel showing results with four significant digits after decimal point

![](images/3acdca56fcef36d83b66567d3ce404c9ba232386b9ae15d37411063779b44041.jpg)  
Figure 98

![](images/bb0310f40b72248e79215ff7873162cc208a62fa88f8ee4f1127f07b7a600f59.jpg)

# Accessing Dataset Information

You can access 2D or 3D dataset information, such as the number of points or elements in a specific material or region. To display the Dataset Information dialog box, choose Data > Dataset Information.

In this dialog box, relevant information about the dataset will be displayed, depending of the dataset and the materials or regions selected. The Datasets group box displays all the 2D and 3D datasets, so you can choose the dataset from which data is extracted (see Figure 99 on page 162). The number of fields, elements, and points are shown in the table located in the upper-right part of the dialog box.

In the Materials/Regions group box, you can select various materials or regions, and the sum of points and elements of each region selected is displayed in the table in the lower-right part of the dialog box.

![](images/f98b06f87559e454d93e8a055573dd62e6a617d59bea277ad59600a3871e08da.jpg)  
Figure 99 Dataset Information dialog box

The total number of points and elements of a 2D or 3D dataset is displayed at any time at the bottom of the main window. It is important to mention that this value might not be the same at the one displayed in this dialog box, since this value is extracted directly from the geometry and the dialog box sums the points and elements of each region separately.

# Maximum and Minimum Locations of Fields

Sentaurus Visual can easily display the maximum and minimum locations of a particular field.

To display these values:

1. On the Plot Properties panel, click the Markers tab.   
2. Select Show Min or Show Max or both options.

When either option is selected, a marker like the one shown in Figure 100 is displayed.

![](images/c496e9b9d552125431f9451be6117fb35006ebbc80c8b295e1f52b54180b4be2.jpg)  
Figure 100 Maximum marker (black circle with cross hairs) and minimum marker (gray circle with cross hairs) shown to left of structure

You also can define constraints for the search pool in the Minimum/Maximum Field Value dialog box. To display this dialog box, choose Tools $>$ Min/Max Field Value.

In the Minimum/Maximum Field Value dialog box, you can select certain regions or materials for the search, and you can define a 3D box limiting the search area.

In the Minimum/Maximum Field Value dialog box, you can select certain regions or materials for the search on the Region/Material tab (see Figure 101 on page 164), and you can define a 3D box limiting the search area on the Domain tab. The Reset button on the Domain tab allows you to return to the initial values of all ranges (see Figure 101 (right)).

If you select the Full Domain type, then the minimum/maximum field value from the entire structure is returned. Otherwise, if you select the Polygonal Domain type, then the Polygonal Domain tab becomes available and the value is calculated from a defined polyhedron as shown in Figure 102 on page 165.

First, select the Extrusion Axis (vertical axis in the resulting polygon). Then, define the Selected Points manually or click the Add by Click button. If a user-defined height is needed, then select Height to set the top and bottom heights of the polyhedron. A minimum of three points is required to perform this analysis.

# Chapter 4: Working With 2D and 3D Plots

Maximum and Minimum Locations of Fields

![](images/71a70beb2872da3cd0ae2b5e3f10762ec72347318655af2894ee2bd3a833de23.jpg)  
Figure 101 Minimum/Maximum Field Value dialog box: (left) Region/Material tab and (right) Domain tab

![](images/e193934b1b0eb29185b9264982f7ff811a261c09c0785d12a80e7b69b40197c4.jpg)  
points

![](images/be7266c6c6d97b589d5c940ffefdfc44450934fbc901667f90bd3001a9aaecf9.jpg)

![](images/99ae87131284e901d6cb4b8c81e05c5c162219e95c899b660946c101dec0dfbb.jpg)  
Points

![](images/764fd59292f9e68c59e838cdc102780dd1cfcb7e229eb7f1d66f5f4e099598ae.jpg)  
Figure 102 Minimum/Maximum Field Value dialog box showing Polygonal Domain tab

# Changing Properties of Markers

You also can change the properties of the marker.

To change to the marker properties:

1. Choose Edit $>$ Preferences.   
2. In the User Preferences dialog box, expand 2D/3D $>$ Fields (see Figure 103).   
3. Change the preferences as required.   
4. Click Save.

![](images/bb399a6f21113ce97d464151c03c2bfddddd55e593615592e4ed54fa359266a5.jpg)  
Figure 103 Available preferences for minimum and maximum markers

You can change the color, the size, and the visualization of both the minimum and maximum markers. When you save the settings, they will be used in the next session of Sentaurus Visual.

# Value Blanking

Value blanking allows you to display only the required areas of interest in a plot. You can enter multiple constraints to blank out areas that meet the criteria.

To use value blanking, click the toolbar button. A dialog box is displayed (see Figure 104) where you can insert constraints on the required fields.

Value blanking keeps the enabled constraints even after closing the window. If you want to revert the changes, you must deactivate the specified constraint or reset all the constraints to return to the usual plot display.

![](images/16148473c2bd55af48347982931060123e34d5b9edb2c59f5bb5be4cd3cd7e47.jpg)  
Figure 104 Value Blanking dialog box

# Choosing Constraints

In the Value Blanking dialog box, you can create a maximum of 10 constraints including different field values. Each constraint creates a particular set of data to be blanked. The sets constructed can be united or intersected, depending of the option selected for the particular constraint.

For example, if cons1 defines set A and cons2 defines set B, the result set to be blanked C can be either $C = A \cup B$ or $C = A \cap B$ depending of the option selected in cons2 (that is, either the Union option or the Intersection option) (see Figure 105).

![](images/daa96da9c0673254beb30e3aac276d83e9cb50343e7128e3f50d16b210697b58.jpg)  
Chapter 4: Working With 2D and 3D Plots Value Blanking   
Figure 105 Value Blanking dialog box showing constraints

![](images/3284d3738ebb300b1e1153e71c978400cff08315c3bac129341744ce5c664f19.jpg)

![](images/feb1f332e111518fe2a09e7983579f455760f4323096469d5d6cf50f332cb2bb.jpg)  
Figure 106 Blanked plot

# Options for Value Blanking

The options for value blanking are available from the for list of the Value Blanking dialog box (see Figure 104). The options are:

all vertices   
• any vertex   
• interpolate vertices

The following figures show examples of using these options. In Figure 109, the interpolate vertices option makes the surface of the field being blanked smoother than when the other options are selected.

![](images/b7eac6b0ca3b3e8df1fd8c1b4ca1858bc326afb25339d860fd40b06c9be7a16e.jpg)  
Figure 107 Example of value blanking using the all vertices option

![](images/b7670c90a2e901494eae1b6ecdd359f1c18664227f62139fe2e05560a229efc1.jpg)  
Chapter 4: Working With 2D and 3D Plots Value Blanking   
Figure 108 Example of value blanking using the any vertex option

![](images/c3c240d9864fed97ac69c8aeda1a34886c13d00be29a2edebf00ee4ce3a93577.jpg)  
Figure 109 Example of value blanking using the interpolate vertices option

# Visualizing Deformation of Structures

Sentaurus Visual allows you to deform a structure according to a certain vector field. In general, the required vector field that will be used to deform the structure is Displacement and, in Sentaurus Visual, it is called Displacement-V (all vector fields have the suffix -V).

Every region that contains the selected vector field will be deformed. This means that every point that defines the region will be moved in the direction and the magnitude of the vector. The magnitude of the displacement can be modified by a factor of the vector. This value is 1.0 by default (no factor is applied).

You can deform structures using either the user interface or the set_deformation Tcl command (see set_deformation on page 351).

In addition, you can apply a deformation factor or create a new deformation plot in a group of plots using the link_plots command. However, if you want to apply a deformation operation but not to all members of a plot group, you must create a special linked group without specifying the deformation property (see link_plots on page 298).

To display the Deformation dialog box, choose Tools $>$ Deformation (see Figure 110). The Deformation dialog box includes the following fields and buttons:

• The Vector field is used to select the vector field that will be used to deform the structure.   
• The Factor field is used to specify the factor of the magnitude vector to be used.   
• The Reset button reverts the structure to its original state.   
• The Apply button applies the specified deformation to the current plot.   
• The Create Plot button creates a new plot with the same structure already deformed.

![](images/e7757f3174e966d0e490fc37d804fb7d586bab3bafda96723bc94b74ae012da8.jpg)  
Figure 110 Deformation dialog box

By default, if the Displacement-V vector field is available, it will be selected automatically in the Vector field. If this vector field is not available, no vector field will be selected. By default, the factor value is 1.0.

![](images/56a6f5e76b9223115389204d915a4f75b1ba146d5f180a510e86849de4e61b62.jpg)  
Figure 111 (Left) Original structure, (middle) structure deformed by a factor of 3, and (right) structure deformed by a factor of 10

![](images/d4923bbd051b0099743c7d369970c98456dfe625e65d777c0b1e551a3ece89a6.jpg)

![](images/61426279aec20eb70f9be7eb33ac75c39f60f7684760d3447066e8a9e23e2d9e.jpg)

# Cutting Structures

Sentaurus Visual provides tools for generating xy and 2D cuts, custom cutlines, and cutlines or cutplanes orthogonal to an axis.

Table 10 Tools for cutting structures   

<table><tr><td>ToolBar button</td><td>Description</td></tr><tr><td></td><td>Displays the Cutlines and Cutplanes dialog box, where you can generate non-orthogonal cutplanes or cutlines directly from a 3D plot, and you can cut in specific values.</td></tr><tr><td></td><td>Creates a custom outline in a 2D plot. The result is an xy plot of the selected field and datasets for all the fields on the outline.</td></tr><tr><td></td><td>Creates an orthogonal plot in one axis. The result is a 2D plot of the cutplane if cutting a 3D plot, or an xy plot from a outline in a 2D plot. If an axis has a constant value, cuts for that axis are deactivated.</td></tr></table>

# Note:

Cut tools ignore shifting or scaling transformations applied to the structure, regardless of visual appearance.

In linked plots, the newly cut structures are created by frame order not load order.

# Generating Precise Cutlines and Cutplanes

Advanced options can be performed using the Cutlines and Cutplanes dialog box (see Figure 112), which allows a greater degree of precision than using mouse operations to generate cuts that require an exact point in the structure.

![](images/57aaf1e6175be8ef52a6496f644c5f2990a0153a0265bd69550eccb266f8f300.jpg)  
Figure 112 Cutlines and Cutplanes dialog box

For 3D structures, you can perform cuts in one of the following ways:

• Orthogonally, by specifying an axis and a value   
• Non-orthogonally, by specifying a normal and an origin point   
• With a polyplane, by specifying an axis and the points of a polyline   
• Creating a cutline directly from the structure

In addition, other cuts can be performed for 2D plots such as a polyline cut or a cut along boundaries. The Cutlines and Cutplanes dialog box provides various Add by Click buttons that allow you to click a point in the plot and to add it to a specific text box. The point clicked in this way will be marked in the plot.

To display the Cutlines and Cutplanes dialog box, click the toolbar button.

For 2D and 3D structures, when Cut Type is set to Cutline, you can specify the regions to use as the source for the cutlines and specify the resulting target plot where the cutline curve will be displayed.

For the source, the following options are available under Source:

• All Regions (default): All regions are cut.   
• Visible Regions Only: All visible regions are cut.   
Custom Selection: You select the regions or materials to be cut in the Custom Selection dialog box (see Figure 113).

![](images/5ea7a1b20596b6b9afcbfd28a87537646a4f71e0c357445e81355a0cbed54510.jpg)  
Figure 113 Custom Selection dialog box

The default target plot is Related Plot (see Figure 112). A related plot refers to any xy plot that has already displayed at least one cutline dataset with the same type of the current cut. For example, if you perform an orthogonal x-cut, a related plot would be a plot created to display another orthogonal x-cut.

The list of the Related Plot option shows the plots associated with the cutline type specified:

• For 2D plots, this is for all cutline types (X, Y, Z, or Free), including polyline cuts and cuts along boundaries.   
• For 3D plots, this is for free-type cutlines only.

You can use the User Preferences dialog box (see Figure 114) to override the default option of the Cutlines and Cutplanes dialog box.

![](images/5aa6f83da5c7d567718206b493168eb8f12b266a75eef1b24ea39afd757fc85e.jpg)  
Figure 114 Specifying the default for cutline target plots in the User Preferences dialog box

# Cutlines in 2D Plots

Creating a new cutline is as easy as selecting an axis and a point in the plane to perform an orthogonal cut or drawing a line using the custom cutline button. The result is a new xy plot as shown in Figure 115.

In the generated xy plot, the y-axis will be displayed in logarithmic scale if the active scalar field in the original 2D plot is visualized using one of the following scales: logarithmic (Log), logarithmic of the absolute (LogAbs), or hyperbolic arcsine (Asinh). Otherwise, the y-axis will be displayed in linear scale.

If the active scalar field uses a custom scale, the y-axis will also be displayed in linear scale. See Visualizing Fields on page 107.

# Note:

Visualization of the cutline result is confined to the current visible portion of the 2D plot. This occurs regardless of whether or not the auto-link or linking features are activated. This helps to maintain focus on the area of interest. To access all the data, click the Reset Zoom button.

![](images/909bb9e3c2df8d22003e29ecdcbbfa7e17f7f418b3c7cafdf5ff4696e3bd4c66.jpg)  
Figure 115 (Left) Cutline drawn on 2D plot and (right) xy plot generated from cut

![](images/4ee42ba80cd3b8de07dcf66f22894320114a8e782faf9aebf7f66d147d93da3d.jpg)

# Manipulating Cutlines

Cutlines can be moved and resized by dragging the cutline handles (the circles at the ends of the cutline), and the cutline plot is updated automatically.

To delete a cutline, select the cutline and press the Delete key.

Note:

The xy plot created is not deleted. Deleting the xy plot does not delete the cutline in the 2D plot.

# Polyline Cuts in 2D Plots

A polyline cut is the union of two or more cutlines where the end point of one is the start point of the other. Polyline cuts can be created selecting the Polyline tab in the Cutlines and Cutplanes dialog box (see Figure 116).

![](images/0b85fc905e14b71d85293adec3157167815942d64659d35ce6c88e5950514a83.jpg)  
Figure 116 Polyline tab

# Chapter 4: Working With 2D and 3D Plots Cutting Structures

The points that define the polyline can be added by using the keyboard, or using the fields in the Point group box, or clicking directly in the plot after clicking the Start Add by Click button. When a point is added, the position of the point is marked on the plot. For example, the points added in Figure 116 will produce the marks shown in Figure 117.

![](images/35eb295c793d9294d6eb460f23e839757c139a174f523556fecf3748e6345b2d.jpg)  
Figure 117 Marks indicate position of points generated from values in Figure 116

When all the points have been added, the cut is created by clicking Create Cuts. An xy plot is created immediately, showing the active field versus distance of the line. In addition, a new dataset is created containing the values along the line in all fields. Figure 118 shows the plot created.

![](images/93a7abcf2551b28ea20dd9d4dcd406c83e803d1c07d896dd4206fceba3be580b.jpg)  
Chapter 4: Working With 2D and 3D Plots Cutting Structures   
Figure 118 New xy plot created from polyline cut

# Manipulating the Polyline

The location of each point can be changed by dragging its handle to a new position. This will update the values of the already created xy plot using the new positions of the points. Other properties such as the line style, color, and size can be changed on the CutPolyline Properties tab of the Properties panel, when the polyline is selected.

# Cutting Along Boundaries

You can cut along boundaries in 2D plots or a free cutplane by using the Boundary tab of the Cutlines and Cutplanes dialog box. Alternatively, use the create_cut_boundary command (see create_cut_boundary on page 223).

# Step 1: Selecting Regions or Materials

Select the target regions or materials of interest. If you do not know which regions or materials you need, you can choose all of them and define them later.

To select regions or materials:

1. Select Regions or Materials.   
2. Move the available regions or materials to the Selected pane as required.   
3. When you are finished, click Next.

![](images/4b132b9bbf42e67cb53cf06a8b5d1800eb7e4ef81fc51e2eac49d0174c04e397.jpg)  
Figure 119 Step 1: selecting regions or materials

# Step 2: Adding Vertex Points

Add the vertex points through which the line will pass. The first point and last point added will be the start and end of the line along the boundaries. The line will also pass through any middle point added in the respective order. If more than one path is possible, Sentaurus Visual will choose the shortest path along the available regions or materials selected in the past step.

To add points:

1. Add points in one of the following ways:

◦ Click Start Add by Click (which changes to the End Add by Click button). Click to add points inside the plot. When you have finished adding points, click End Add by Click.   
◦ Use the Add Point fields to enter the x-, y-, and z-coordinates for a point. Click Add Point. The point is listed in the Selected Points pane. Continue to add points as required (see Figure 120).

In both cases, if the point added is not on a boundary, Sentaurus Visual selects the nearest boundary to that point.

2. When you have finished adding points, click Next.

![](images/ed40b6e4892d53fc53598d74a3066d7647b34fd11875e6002642118b8f742057.jpg)  
Figure 120 Step 2: adding vertex points in (left) 2D plot and (right) free cutplane

![](images/f3478336883f28ef3f6306ff64d5dd69436bbb2d739ead7b92a40f5f3e26a48c.jpg)

# Step 3: Choosing Segment Regions

After you have added the vertex points, Sentaurus Visual divides the resulting line into various segments defined by the intersections of neighboring regions. In each segment, the required region from which the data will be extracted can be chosen by clicking the cell in the Region column (column 3), as shown in Figure 121.

When all the regions in each section are selected, the cut can be created by clicking Create Cuts. The default segment regions are chosen by the order of regions or materials previously set.

![](images/43c56a2b3d79f592392bdd7c559214b52f9ceba7a2a64dca6d5fe2bc6320077d.jpg)  
Figure 121 Step 3: choosing segment regions

The resulting plot shows the values along the selected regions of the active field versus distance. In addition, a dataset containing all the respective fields is created (see Figure 122).

![](images/dde3b0f780f05786652bfdccc75664db3d4ae42fa4934bedee3c8200354def8e.jpg)  
Figure 122 (Left) Original 2D plot and (right) resulting xy plot from cutting along boundaries

![](images/8c3a2744036b87c0e91d4fcd4add1d391e774899706b02d0024f87f25a423248.jpg)

# Surface Cutlines From 3D Plots

You can extract data defined on the surface of a structure along an axis-aligned cutplane. The extraction generates 1D data, where a curve is displayed automatically with the active scalar field in the source plot.

# Note:

This feature is available only for particle Monte Carlo (PMC) structures generated by Sentaurus Topography 3D.

To create a surface cutline from a PMC structure:

1. On the Surface tab of the Cutlines and Cutplanes dialog box, under Plane Component, select the axis to which the cutplane should be aligned (see Figure 123 on page 185).   
2. Under Position, specify where the cutline should be located.   
3. Under Axis X, select the component variable to use in the abscissa (x-axis) for xy plots.   
4. Click Create Cuts.

Alternatively, you can use the create_cutline command (see create_cutline on page 224).

![](images/8d76cfad0b5a22eb61d50891fc20610a398366970f027b643f425678bd57ac65.jpg)  
Chapter 4: Working With 2D and 3D Plots Cutting Structures   
Figure 123 Surface tab

![](images/380088ee53cf320ff9b0bb393e8b911aff0e52ea0897cf9fc23a927e406cec08.jpg)  
Chapter 4: Working With 2D and 3D Plots Cutting Structures   
Figure 124 (Left) Cutplane on the surface of a PMC structure and (right) xy plot generated from the surface cut

![](images/f7a21fcc7a255fe8895d5dd3c4c9880e2d943081fbac2a02627097044362f7f3.jpg)

# Changing Properties of Cutline Along Boundaries

Some properties such as the color, size, and type of the line can be changed in the Cutline Properties tab, which is displayed when the line is selected in the plot. The color and visibility of the handles of the first and last points can be changed as well.

# Two-Dimensional Projections

Two-dimensional projections can be obtained from 3D plots. The resulting plot is either the maximum or minimum field value projected to one plane, which can be aligned to the orthogonal axes or arbitrarily defined. In addition, you can define a polyline path to create a sequence of projected planes.

You can create a 2D projection of a 3D plot by either using the GUI (choose Tools $>$ Create Projection) or using the command create_projection or create_projection_path (see create_projection on page 232 and create_projection_path on page 234).

![](images/e10e8fdfa43f688f0adf51bac61f951e4edd95e03fea95030581ea73d0f6a43c.jpg)  
Figure 125 2D Projection dialog box showing (left) Region/Material tab and (right) Domain tab

![](images/06b3518b1ed0f5676e5c8837bf841f580c22df1ef805f09167520c9fb3cdba24.jpg)

To create a 2D projection of a 3D plot, performed on all regions, or selected regions or materials:

1. Choose Tools $>$ Create Projection.

The 2D Projection dialog box opens.

2. From the Type list, select the plane for the projection.

This functionality is valid only for projection types X, Y, and Z.

3. Select the function from either Minimum or Maximum.

4. On the Region/Material tab, select whether you want to perform the projection on all regions or selected regions or materials (see Figure 125 on page 187 (left)).   
5. Under Resolution, specify the number of points to consider on each axis.

Greater resolution means more accurate data extraction, but with a longer processing time.   
6. When are finished, click Create Projection.

The projection can be performed in all domains or in a smaller window defined on the Domain tab as shown in Figure 125 (right). This functionality is valid only for projection types X, Y, and Z.

![](images/bb5be379876c0adc537d4a343283513036a60cc27faadb45e7ea243f3a98da1e.jpg)  
Figure 126 2D Projection dialog box showing (left) Free tab and (right) Path tab

![](images/736f242c2203cd779f040594aff6a57fb9201fdca39dc1e07893cde347b5708a.jpg)

The projection can be performed in arbitrary planes defined by you. You must select Free from the Type list. The Free tab becomes available and allows you to define the origin and normal for the plane (see Figure 126 on page 188 (left)). If you select Width, then it restricts the domain considered for the projection to all the points between a half-width distance to the plane.

To define a path across the plot to perform a projection:

1. From the Type list, select Path.

The Path tab becomes available (see Figure 126 (right)).

2. Select the Extrusion Axis (vertical axis in the resulting 2D plot).   
3. Define the points manually or use the Add by Click button.   
4. If a user-defined width is needed, then select Custom Width to allow you to set either the same width for all planes (Constant) or individual widths for each plane (Custom Values).

Note that the number of widths equals the number of planes to be generated. The number of planes to be generated equals the number of points previously defined minus one. At least two points are required to perform this type of analysis.

5. After you have defined the variables, click Create Projection.

Figure 127 shows the final plot for the maximum value of a yz projection.

![](images/f284c78258a5a43c1a422211e0ecfa1f7063fec45aa4bf9706e9dfe7991fcd2f.jpg)  
Figure 127 (Left) Original 3D plot and (right) 2D projection of the 3D plot

![](images/839d61b33635bd3a39e59e0c1b85df7cf1ea921b4a1252685401f55a9b97d6f8.jpg)

# Cutplanes in 3D Plots

In 3D plots, orthogonal cutplanes can be created by selecting a cut axis and then clicking the required point of the plot. The result is a new 2D plot with the same fields as the original plot as seen in Figure 128. Such a 2D plot can be cut further by a cutline to generate an xy cut.

Cutplanes also can be moved by dragging, and the 2D plot is updated automatically. In addition, xy plots created from such 2D cuts are updated automatically.

![](images/f60f07e8ef12e99992a2004c36816e83ca09f265c8de4f707703d6c4a7000de2.jpg)  
Figure 128 Cutplane in a 3D plot and the generated 2D plot, which is cut further to generate an xy plot

![](images/90302ec87636ffbb633e04280fbaf931eb687a6997c390308a411a89ad112cf7.jpg)

![](images/c268aaac29984704d8e6c2d81e376ee14081331cc8b90e70d1d552c9e089b201.jpg)

To delete a cutplane, select the cutplane and press the Delete key.

# Note:

Deleting the 2D plot does not delete the cutplane in the 3D plot.

The mesh shown on the cutplane is recalculated by triangulating the resulting points of the cut, which means, for example, that an axis-aligned cut of a rectangular mesh shows a triangular mesh.

# Extracting the Path of Minimum or Maximum Values of a Scalar Field

You can extract the path of either the minimum or maximum values of a specified scalar field.

You can use a Tcl or Python command to extract the path (see extract_path on page 251) or the corresponding dialog box, which is available from Tools $>$ Extract Path.

The Extract Path dialog box has different modes of operation that use different algorithms for extracting the path:

The 2D mode applies to 2D plots and its algorithm extracts the minimum or maximum values of a specified scalar field along the horizontal axis. This extraction does not refer to a specific axis, so interchanging the x-axis and y-axis of a 2D plot generates different results.

The 2D algorithm recalculates the mesh for the 2D structure, normalizing the mesh to the smallest cell width in the horizontal direction. However, if this recalculation exceeds millions of divisions, Sentaurus Visual resolves this to one million divisions to maintain tool performance (see Figure 129 on page 196).

The 3D mode applies to 3D plots and its algorithm extracts the minimum or maximum values of a specified scalar field along the mesh of the structure. This algorithm does not depend on the orientation of the structure.

The 3D algorithm analyzes the existing mesh to find the minimum or maximum path between two points that can be constructed using the mesh elements.

To extract a path:

1. Choose Tools $>$ Extract Path.

The Extract Path dialog box opens.

2. Leave the plot name in the Plot field. This is the name of the active plot.   
3. Select the geometry from the Geometry list.   
4. Select the scalar field for extraction from the Scalar Field list.

# Chapter 4: Working With 2D and 3D Plots

Extracting the Path of Minimum or Maximum Values of a Scalar Field

5. Select which values you want to extract: Minimum Path or Maximum Path.   
6. On the Region/Material tab, select one of the following:

◦ All: To extract the path over all materials and regions   
◦ Materials: To extract the path over selected materials   
◦ Regions: To extract the path over selected regions

The materials and regions shown in the Available pane depend on which ones are present in the plot.

![](images/179505c3fbe5f8b09b6b709d478fafe6615ce078c07c0f824240c99ec84db555.jpg)

7. (Optional) For greater precision, click the Domain tab and specify the start and end points of a smaller window of analysis.

![](images/f7b6e5235cb552c1926579c83eddc9f164119c130edf0ba394044392e5f5153d.jpg)

8. If the plot is three dimensional, then the Start/End Points tab and Polygonal Domain tab are available.

Specify the start and end points of the path on the Start/End Points tab.

![](images/edcc7cd518e2b11758a0e400d762b558fa14f22294fec6b423ca67c06748cbbe.jpg)

9. The domain of the path can be bounded by a polyhedron that results from extruding a polygon drawn in the 3D model through any of the x-, y-, or z-axis. This can be configured on the Polygonal Domain tab.

# Chapter 4: Working With 2D and 3D Plots

Extracting the Path of Minimum or Maximum Values of a Scalar Field

Specify the start and end points, the polygon points, and the extrusion axis. Optionally, the top and bottom faces can be set if the start or end points are inside the model.

![](images/0aa3e1f0688dc7fd2fa560c303321244550d626bb1a3f148bd583168b31fc43d.jpg)

10.Click OK.

![](images/109610bf1ba457697cdb1ec3d35c9e6526e50ff6438d6a0c5b2e7ead3a61f392.jpg)  
Figure 129 (Left) Original 2D structure and (right) extracted path over the entire 2D structure

![](images/9246819a4360a2b537cde5908594b9c95fe01e97d5587da9b18bd78631338e9e.jpg)

The extraction results in the creation of a new geometry in the structure that behaves like an interface region, allowing you to visualize the field values in the path, even if the main geometry does not display field data (see Figure 130).

![](images/d7c8df2bf5370c877483fedd66257193eb76385ba14a80ec1defb09ff1dc6f77.jpg)  
Figure 130 Field values along the extracted path, with main geometry displaying no field data

In addition, in 3D mode, the new geometry has an extra field that represents the saddle points of the extracted path. See find_values on page 256 for more information about how to obtain the exact position of the saddle points.

See Visualizing Fields on page 107 for more information about visualizing scalar fields.

When you extract a path using the Extract Path dialog box, which is not a cutting operation, in addition to the path shown in the plot, a regular xy plot is generated showing a curve of the extracted path field (see Figure 131). This xy plot is generated using the create_curve and create_plot commands.

![](images/265c372a6dc0db48baace77794916183d13039929b8c6769bdbec6720c97cdb6.jpg)  
Figure 131 Extracted path displayed as an xy plot; curve represents the banded field (ElectrostaticPotential)

# Surface Plots

A surface plot is a 3D plot generated from a 2D dataset (or plot), where the constant component (the z-axis if the original structure plane is the xy plane) is filled with an existing scalar field. As the new dataset contains the three components (x-axis, y-axis, and z-axis) defined, it behaves as a typical 3D dataset. If a 3D dataset is created, it will be shown as a new plot.

The new 3D dataset will contain the same regions and fields as the source dataset, which can be independent of the source plot. In addition, Sentaurus Visual recalculates the junction line and the depletion region, to show them according to the new surface.

The created 3D surface plot inherits the current field with filled contour bands and the visibility options of all regions. This means that the surface plot hides regions that are not shown in the source plot.

# Creating Surface Plots

You can create a surface plot using either the Surface Plot dialog box (choose Tools > Surface Plot) or the create_surface command (see create_surface on page 239).

In the Surface Plot dialog box, you can choose the geometry of the plot (if there is more than one), the field to be used, the range, the scaling type, the factor to define how the values of the field will affect the constant component, and the name of the new dataset generated.

![](images/b3d5c7b4070b929a8b263c9854fb1663e9010e4615cf3682b00a7d61c88f1016.jpg)  
Figure 132 Surface Plot dialog box: (left) creating a surface plot and (right) modifying the newly created surface plot

![](images/0fa6eda74fdb1b95e5d6aa241e48a182be80d6c10d6c8a63aa30521696dc77cc.jpg)

After the new surface plot is created, the dialog box does not close. It changes appearance to allow you to modify the last generated surface plot (see Figure 132, right). Some fields are deactivated. The remaining fields can be changed to fine-tune the surface plot. With each change that is applied, the plot is updated.

![](images/3e3fa8de1288b375a80b98dcd76dd2312d6480805ae5f89ed52ca34de3460f9b.jpg)  
Figure 133 (Left) Two-dimensional source plot and (right) generated surface plot using the ElectrostaticPotential field

![](images/b6f594730bfef80fd7c04c621bea4787a9d61f20a5a9741b6c341b54b2d1ef09.jpg)

# Isosurfaces and Isolines

Sentaurus Visual can extract isosurfaces and isolines from 3D and 2D structures, respectively. These iso-geometries are extracted using a constant value (isovalue) over a specified field and structure. The extracted iso-geometry is displayed in the same plot as the source geometry, such as an overlay plot. The new iso-geometry is divided into different regions and contains the same fields as the source geometry. This means that it is possible to display the same or different fields in both geometries. By default, the new iso-geometry has a constant color to help identify it easily. A plot can contain as many iso-geometries as you want.

The new iso-geometry does not contain any line or particle region from the source geometry and contains only the regions that have values of the specified field.

# Creating Iso-Geometries

You can create a new iso-geometry using either the Create Isovalue Geometry dialog box or the create_iso command (see create_iso on page 230).

# Note:

After you create an iso-geometry, the Create Isovalue Geometry dialog box remains open and changes automatically to the modification mode, so that you can modify the iso-geometry if required (see Modifying Iso-Geometries on page 201).

To create a new iso-geometry using the Create Isovalue Geometry dialog box:

# 1. Choose Tools $>$ Create Isovalue.

The Create Isovalue Geometry dialog box opens. The New option is selected by default.

![](images/d1a5709e1f05fb907b65873825e6e9d1387e82ba31bb0f7a38b62ecacba385e7.jpg)

2. Select the geometry of the plot (if there is more than one).   
3. Select the field to be used.   
4. Enter the name of the new iso-geometry (or dataset).   
5. Select the color with which to display the new iso-geometry.   
6. In the Value field, enter the isovalue to use to build the iso-geometry.   
7. In the Factor field, enter a factor.

For nonlinear fields, the Factor field defines how the slider value changes between steps. By default, this value is 10. For linear fields, the Delta value defines the size between steps.

8. Use the Range slider or the - and $^ { + }$ buttons to identify where the value lies in the range of the field.

The slider responds according to the selected field scale, shown to the right of the Field list.

9. Click Create.

![](images/fa49dc5846b53aff1b510026509ce3d6c6900cea9fbce789d72f289ef35fe9f0.jpg)  
Figure 134 (Top) Source geometry with translucency showing the new iso-geometry generated (ElectrostaticPotential = 0 V) and (bottom) iso-geometry displaying the DopingConcentration field

![](images/3b17005b50f053da35e2a91696d4708bfcc8ab61dfdfd586ecee264afadb1c18.jpg)

# Modifying Iso-Geometries

You can modify iso-geometries using either the Create Isovalue Geometry dialog box (see Creating Iso-Geometries on page 199) or the create_iso command (see create_iso on page 230).

To modify an iso-geometry using the Create Isovalue Geometry dialog box:

1. Ensure the Modify option is selected.

![](images/d0b791191e74a3dff2b64308251dfda889a106e4025d321f41d881e10187a0bd.jpg)

2. Change the fields as required.

Note:

You can change all the fields except the name of the iso-geometry.

3. Click Apply.

# Streamlines

Streamlines are a family of curves that are instantaneously tangent to the velocity vector of the flow. Sentaurus Visual allows you to visualize these streamlines for the available vector fields in 2D or 3D plots.

Streamlines are created only in the active plot by default, even if the active plot is part of a linked plot group. This is mainly because the velocity vector might not be present in all plots belonging to the group and the extensibility of the create_streamlines, extract_streamlines, and set_streamlines_prop commands cannot be ensured. However, if you want to apply streamlines to a plot group, you must create a special linked plot group to allow streamlines for that plot group (see Linking Plots on page 51 and link_plots on page 298).

Note:

If plot group members do not have similar data, then the results might be unexpected.

# Displaying Streamlines

Click the toolbar button to display the Streamlines dialog box (see Figure 135), where you can select the vector field, the starting point, and the display properties.

In this dialog box, several properties can be defined to customize the display of the streamlines.

![](images/1ebeb88469ca069715fdc1047df8d7bcae6cbdfebce6a7ee80926e9184aa3c68.jpg)  
Figure 135 Streamlines dialog box showing Position tab, before creating streamlines

# Position Tab

The fields of the Position tab are:

• The Vector Field box is where you select the field used to calculate the streamlines.   
• The Direction box allows you to show only streamlines ending on a point, starting from a point, or both.   
The Create Rake option allows you to create multiple streamlines between the start and end points. The number of streamlines is defined by the value in the Streamlines per Rake box.   
The Add by Click button allows you to add the start point and the endpoint for the rake using the mouse to click the selected plot. If the Create Rake option is selected, you can add two positions. If the Create Rake option is not selected, you can add one position.

# Chapter 4: Working With 2D and 3D Plots Streamlines

The Create Streamlines button allows you to create a family of streamlines going from a starting point to a rake end point. This button also changes its behavior when existing streamlines are selected from the list, allowing you to modify their attributes without creating new streamlines.

![](images/d5bd3c90e77bfd67c5541968a96a96fcef5ba440a8a457fd3652ea6d7668be4a.jpg)  
Figure 136 Example of displaying streamlines on plot

# Specifying Regions or Materials

On the Regions/Materials tab, you can specify in which regions or materials the streamlines will be plotted. Not selecting a region or material causes Sentaurus Visual to plot the streamlines over the complete structure.

# Representing the Streamlines

On the Representation tab, you can make cosmetic changes to the appearance of streamlines such as the line style, width, and resolution, as well as the color and the size of the vector field arrows.

# Integration Settings

Sentaurus Visual has default integration settings that work with most of the simulation results obtained from other TCAD tools. However, users have the opportunity to fine-tune these values if needed. The Integration tab is for this purpose.

# Integration Tab

By default, the Runge-Kutta 4 (RK4) algorithm is used for numeric integration of the fields. Some details about this integration can be modified. These values are included in the create_streamline command (see create_streamline on page 237). When you use the Streamlines dialog box, you can select between the values calculated by Sentaurus Visual or the default values specified in the User Preferences dialog box.

Step options are:

Initial sets the initial step for the vector field integration. In the Runge-Kutta 4 (RK4) algorithm, the initial step is also a constant length for all steps.   
Max Step sets the maximum number of steps until the end of the integration. For termination constraints, either the Max Step value or the Terminal Speed value can be changed.

Others options are:

Maximum Propagation controls the length of the streamline. If the Both Direction option is selected, the maximum length will be two times this value.   
Terminal Speed sets an end constraint for the numeric integration. If the particle speed is reduced to a value less than this number, the integration will end. For termination constraints, either the Terminal Speed value or the Max Step value can be changed.

# Managing Created Streamlines

The Streamlines dialog box includes a list of the created streamlines in the Streamline Names pane. If you select <New> in this pane, you enter the creation mode, in which you can create streamlines. In the same way, if you select another streamline, the update mode is activated.

In the update mode, the Streamlines dialog box executes the set_streamline_prop Tcl command, which changes the representation of the streamlines by updating their properties without creating new ones in a faster way. Selecting a streamline in the Streamline Names pane also highlights the streamline in the plot, allowing you to easily identify the active streamline.

# Configuring General Parameters of Streamlines

In the User Preferences dialog box (choose Edit $>$ Preferences), several parameters are available that can be changed to improve the performance of creating streamlines (expand 2D/3D $>$ Streamlines) (see Figure 137).

![](images/cf0f1ace4e2ed6c6c9baf493a30709e7b81e4b8b4fa7625495620f06f0822082.jpg)  
Figure 137 User Preferences dialog box showing (left) parameters for streamlines and (right) parameters for threads (used by streamlines)

![](images/88de2456d6b0cfa4dca009072331d064936a8d9706bef0794624063d003b6356.jpg)

Sentaurus Visual calculates the best integration parameters depending on the selected structure and vector fields. You can define the number of threads used to create rakes of streamlines in the User Preferences dialog box: expand Common $>$ Miscellaneous and, under Threads, define the maximum number of threads. You can select Auto next to the Max Number field to let Sentaurus Visual compute the ideal number of threads to use or set a preferred value (see Figure 137).

# Extracting Data From Streamlines

Sentaurus Visual can extract data from existing streamlines. Each streamline generates its own 1D dataset that contains the coordinates data defining the streamline as well as all scalar fields defined in the geometry.

Extracting data using the Streamlines dialog box will create a new xy plot (if it is not created already) and one curve for each streamline extracted, displaying the current contour-banded field (from the source plot) versus distance. If the field is scaled with something other than Linear or Custom, Sentaurus Visual will set the vertical axis (left y-axis) to logarithmic scale (see Visualizing Fields on page 107).

To extract data from streamlines:

1. Select one or more streamlines from the Streamline Names pane.

This makes the Extract and Delete buttons available (see Figure 138).

2. Click Extract.

![](images/2830ff185c90689777a772a4535fb3c8afae04437eed5884a96ff9adcec26d59.jpg)  
Figure 138 Streamlines dialog box showing Representation tab: streamlines have been created and some are selected, and the Extract button is available   
Figure 139 shows the results of the extraction operation.

The equivalent command for extracting data from streamlines is extract_streamlines (see extract_streamlines on page 253).

![](images/5e0e7f1a96ab68a0ae856d32239c7ddb4db3ae604b5d6b68f1f58a07a9391b9c.jpg)  
Chapter 4: Working With 2D and 3D Plots Streamlines   
Figure 139 (Top) Two-dimensional plot displaying three streamlines and (bottom) xy plot displaying three curves from the data extracted from the streamlines

![](images/5d6f5a80816d0cabc2ca473a3b1f74b7e86181d9986647a2de2c36a4ac9aa6d5.jpg)

# 5

# 5Automated Tasks

This chapter presents how to automate tasks with Tcl or Python scripting and Inspect compatibility.

# Running Tcl or Python Scripts

Sentaurus Visual allows scripts to be called from the command line or the user interface.

To run a Tcl script from the command line, enter:

svisual /path/to/script.tcl

To run a Python script from the command line, enter:

svisual -python /path/to/script.py

To run a script from the user interface:

► Choose File $>$ Run Script.

The following examples illustrate some typical scripting uses in the context of batch scripts.

# Example: Plot Id–Vg Curve

The contents of the script plot_idvg.tcl are:

# Load PLT data file.

set mydata [load_file IdVg_n62_des.plt]

# Create new empty xy plot.

set myplot [create_plot -1d]

# Create Id-Vg curve using loaded dataset and display on new xy plot.

set IdVgcurve [create_curve -plot $myplot -dataset $mydata \

-axisX "gate InnerVoltage" -axisY "drain TotalCurrent"]

# Customize the curve.

set_curve_prop $IdVgcurve -plot $myplot -show_markers -markers_size 7 \

# Chapter 5: Automated Tasks

Running Tcl or Python Scripts

-color red -label "nMOS"   
# Display grid and set grid properties.   
set_plot_prop -show_grid   
set_grid_prop -showminorlines \ -line1_style dash -line1_color #a0a0a4 \ -line2_style dot -line2_color #c0c0c0   
# Assign axis labels and set range.   
set_axis_prop -plot \\(myplot -axis x -title "Vgate \[V]"   
set_axis_prop -plot \\)myplot -axis y -title "Idrain \[A/um]" -type log   
set_axis_prop -plot \$myplot -axis y -range {1e-09 0.0002}   
# Export plot into PNG file.   
export_view "curve.png" -plots \$myplot -resolution 500x500 \ -format PNG -overwrite

The first three commands of this script open a .plt file and create an ${ \sf I } _ { { \sf d } } - { \sf V } _ { \sf g }$ curve. Next, the plot is customized to make it more readable. Finally, the plot is exported to a .png file (see Figure 140).

# Note:

This script must be executed with the virtual X server option to allow graphics export in batch mode. For example:

% svisual -batchx plot_idvg.tcl

![](images/bc0cc9513e1df002ced4c6ed0e44b0f50ea9d5dff5e161478c31522a66a50387.jpg)  
Figure 140 $I _ { d } - V _ { g }$ plot from xy data

# Example: Create Cutline and Export Cutline Data to CSV File for Further Processing

The contents of the script plot_npn.tcl are:

```tcl
Load TDR file.  
set mydata2D [load_file npn_msh.tdr] 
```

```tcl
Create new plot.   
set myplot2D [create.plot -dataset \$mydata2D] 
```

Create 1D outline normal to x-axis at point $x = -0.005$ set mydata1D [create Outline -plot $\$ \text{myplot2D}$ -type x -at -0.005] export_variables {DopingConcentration xMoleFraction Y} \-dataset $\$ \text{mydata1D}$ -filename "data.csv" -overwrite

The first two commands load and display a TDR file. The next create_cutline command creates a cutline at the specified location. The last command exports the selected variables from the cutline to a CSV file.

# Note:

This script can be run solely in batch mode, with the command:

% svisual -batch plot_npn.tcl

# Saving Command History

Almost every action performed in Sentaurus Visual is replicated in the Tcl or Python Console. These actions can be saved to be executed in another session by clicking the Save button in the Console.

# Running Inspect Command Files

Sentaurus Visual can run Inspect command files.

You can run an Inspect command file in the same way as for a native Sentaurus Visual Tcl script.

# Script Library

Sentaurus Visual allows you to add Tcl script files as libraries, which can be loaded automatically at startup or manually using the Tcl command load_library (see load_library on page 320).

# Chapter 5: Automated Tasks Script Library

A script library has the file name formatted as <libraryName>.tcl.

The default library path is $STROOT_LIB/svisuallib. In addition, it includes a user-defined library path, which is set by default to ${HOME}/svisuallib, but it can be modified in the user preferences.

# Note:

The default value for the STROOT_LIB variable is $STROOT/tcad/$STRELEASE/ lib.

Both paths can be checked for Tcl scripts (any file with the extension .tcl) for auto-loading at startup, which can be switched on or off in the user preferences.

The following options related to launching Sentaurus Visual are only valid when the auto-loading of the script library is switched on:

• -nolibrary deactivates the auto-loading of scripts from the library.   
-librarypath <customPath> adds a custom path to the list of library paths to look for script files when auto-loading is switched on.

# Restrictions

Every procedure defined in a script library must begin with the prefix lib_ to avoid the possible redefining of any existing Sentaurus Visual command.

At the time of loading one or more script files from the script library paths, if there are procedures that have been defined without this prefix, a warning message will be displayed, listing these procedures.

Moreover, if there are procedures that redefine Sentaurus Visual commands, a second warning message is displayed.

# A

# ATcl Commands

This appendix describes the tool command language (Tcl) commands that can be used in Sentaurus Visual.

The Tcl commands apply to all plots and structures unless stated otherwise.

# Syntax Conventions

The following conventions are used for the syntax of Tcl commands:

• Angle brackets – <> – indicate text that must be replaced, but they are not part of the syntax.   
• Braces – {} – are used for lists of values, and they must be included in the syntax.   
• Brackets – [] – indicate that the argument is optional, but they are not part of the syntax.   
Parentheses – () – are used solely to group arguments to improve legibility of commands, but they are not part of the syntax.   
• A vertical bar – | – indicates options, only one of which can be specified.

# Object Names: -name Argument

For all Tcl commands that use the -name argument, if a name conflict is detected, Sentaurus Visual will print an error message and stop execution of the command. For example:

```tcl
create_plot -name newPlot -dataset 3D
##-> newPlot
create_plot -name newPlot -dataset 2D
##-> "Error: create_plot: The plot couldn't be created. Plot name 'newPlot' already exists." 
```

If you do not specify the -name argument in a command, Sentaurus Visual will generate an internal name that will remain consistent in a script. If the name generated conflicts with a

name defined later in a script for the same type of element (such as a curve or cutline), Sentaurus Visual will print an error message and stop execution of the command.

# Common Properties

The following properties are used in several Tcl commands.

# Colors

In Tcl commands that allow you to specify color properties (such as the -color <#rrggbb> option), a string specifying red, green, and blue components of the RGB system is expected. The string is preceded by a hash (#) character, and each value is provided in hexadecimal form. Common colors also have aliases.

Table 11 Common colors   

<table><tr><td>Alias</td><td>General form</td><td>Description</td></tr><tr><td>white</td><td>#FFFFFF</td><td>White</td></tr><tr><td>black</td><td>#000000</td><td>Black</td></tr><tr><td>red</td><td>#ff0000</td><td>Red</td></tr><tr><td>darkRed</td><td>#800000</td><td>Dark red</td></tr><tr><td>lime</td><td>#00ff00</td><td>Light green</td></tr><tr><td>green</td><td>#008000</td><td>Dark green</td></tr><tr><td>darkGreen</td><td>#006400</td><td>Darker green</td></tr><tr><td>blue</td><td>#0000ff</td><td>Blue</td></tr><tr><td>darkBlue</td><td>#000080</td><td>Dark blue</td></tr><tr><td>cyan</td><td>#00fff</td><td>Cyan</td></tr><tr><td>darkCyan</td><td>#008080</td><td>Dark cyan</td></tr><tr><td>magenta</td><td>#ff00ff</td><td>Magenta</td></tr><tr><td>darkMagenta</td><td>#800080</td><td>Dark magenta</td></tr><tr><td>yellow</td><td>#FFFFFF00</td><td>Yellow</td></tr><tr><td>olive</td><td>#808000</td><td>Olive or dark yellow</td></tr><tr><td>orange</td><td>#ffa500</td><td>Orange</td></tr><tr><td>darkOrange</td><td>#ff8c00</td><td>Dark orange</td></tr><tr><td>gray</td><td>#a0a0a4</td><td>Gray</td></tr><tr><td>darkGray</td><td>#808080</td><td>Dark gray</td></tr><tr><td>lightGray</td><td>#c0c0c0</td><td>Light gray</td></tr><tr><td>skyblue</td><td>#87ceeb</td><td>Sky blue</td></tr><tr><td>slategray</td><td>#708090</td><td>Slate gray</td></tr><tr><td>chocolate</td><td>#d2691e</td><td>Chocolate</td></tr></table>

# Fonts

For Tcl commands that allow you to adjust font properties, Sentaurus Visual defines a specific list of font families and attributes.

Table 12 Font families and their attributes   

<table><tr><td>Font family</td><td>Attribute</td></tr><tr><td>Arial</td><td>Bold</td></tr><tr><td>Courier</td><td>Italic</td></tr><tr><td>Times</td><td>Normal</td></tr><tr><td></td><td>Strikeout</td></tr><tr><td></td><td>Underline</td></tr></table>

# Note:

In xy plots, the font size of different elements of the plot are set with the font_size argument; whereas in 2D and 3D plots, the font size cannot be set directly. Instead, the font size is set as a factor of the plot frame (the default value is 1.0), with the font_factor argument.

# Lines

For Tcl commands that allow you to adjust line properties (such as the -line_style option), Sentaurus Visual defines a specific list of line styles. You can provide the name of the style or its short form directly.

Table 13 Line styles   

<table><tr><td>Name of line style</td><td>Short form of line style</td><td>Description</td></tr><tr><td>solid</td><td>-</td><td>Continuous line: __________</td></tr><tr><td>dot</td><td>.</td><td>Dotted line: ________________</td></tr><tr><td>dash</td><td>-</td><td>Dashed line: ________________</td></tr><tr><td>dashdot</td><td>-.</td><td>Alternating dash-and-dot line: -____________________</td></tr><tr><td>dashdotdot</td><td>-..</td><td>Alternating dash-and-two-dots line: -____________________</td></tr></table>

# Markers

Different markers are available to use in xy plots in Sentaurus Visual. Tcl commands allow you to use the name or the short form of each marker.

Table 14 Marker types   

<table><tr><td>Name of marker type</td><td>Short form of marker type</td><td>Description</td></tr><tr><td>circle</td><td>○</td><td>○</td></tr><tr><td>circlef</td><td>of</td><td>●</td></tr><tr><td>diamond</td><td></td><td>◇</td></tr><tr><td>diamondf</td><td></td><td>◆</td></tr><tr><td>square</td><td></td><td>□</td></tr><tr><td>squaref</td><td></td><td>■</td></tr><tr><td>plus</td><td>+</td><td>+</td></tr><tr><td>cross</td><td>x</td><td>x</td></tr></table>

# add_custom_button

Adds a custom button to the Scripts toolbar.

# Note:

This command works only in interactive mode. It has no effect in batch mode.

If both -icon and -name are specified, only the icon is shown in the toolbar.

# Syntax

```txt
add_custom_button
- file <stringValue> | -script <stringValue> | -separator
[--desc <stringValue>] [--icon <stringValue>] [--label <stringValue>] [--name <stringValue>] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-desc</td><td>Text that describes the button. This appears as the toolbar of the button.</td></tr><tr><td>-file</td><td>Name of a Tcl file to execute.</td></tr><tr><td>-icon</td><td>Specifies a graphics file to be used as the button icon. Supported file formats are BMP, GIF, PNG, and SVG.</td></tr><tr><td>-label</td><td>Specifies a label for the button.</td></tr><tr><td>-name</td><td>Name of the button in the Scripts toolbar. See Object Names: -name Argument on page 213.</td></tr><tr><td>-script</td><td>Name of a Tcl script to execute.</td></tr><tr><td>-separator</td><td>Adds a separator between buttons in the Scripts toolbar.</td></tr></table>

# Returns

String with the name of the custom button specified by -name. If this argument is not specified, the command returns the default name, which is S<number>, where <number> starts at 1 and increases each time a custom button is created.

# Example

add_custom_button -script "echo Hello World!" -name Greetings \ -desc "Echoes a Hello World Message."

#-> Greetings

# add_frame

Adds a new frame to the frame buffer.

# Note:

You must use of the start_movie command before using the add_frame command.

# Syntax

add_frame [-name <stringValue] [-plot <stringValue>]

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-name &lt;stringValue&gt;</td><td>Name of the new frame to be captured. See Object Names: -name Argument on page 213.</td></tr><tr><td>-plot &lt;stringValue&gt;</td><td>Name of the plot where the new frame will be saved. Current active plot is used by default.</td></tr></table>

# Returns

String.

# Example

add_frame -name Frame1 #-> Frame1

# See Also

start_movie on page 382

# calculate

This function extracts FET parameters from $\mathsf { I } _ { \mathsf { d } } - \mathsf { V } _ { \mathsf { d } }$ or ${ \sf I } _ { { \sf d } } - { \sf V } _ { \sf g }$ curves.

# Note:

This command applies to xy plots only.

# Syntax

calculate <stringValue> -op vth | gmmax | idsat | ioff | rout | ron [-plot <stringValue>]

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringValue&gt;</td><td>Name of the curve on which to apply the parameter extraction.</td></tr><tr><td>-op vth | gmax | idsat | ioff | rout | ron</td><td>Parameter to be extracted from the curve. For more detailed information about the extraction parameters, see Computing Electrical Characteristics on page 97.</td></tr><tr><td>-plot &lt;stringValue&gt;</td><td>Name of the plot on which to apply the parameter extraction.</td></tr></table>

# Returns

Double.

# Example

calculate Curve_1 -op ron #-> 0.0554013

# calculate_field_value

Calculates the minimum and maximum values of a particular field, and shows (with a marker) the location of these values.

# Note:

This command applies to 2D and 3D plots only.

# Syntax

```txt
calculate_field_value -min | -max  
[-dataset <stringValue> | -plot <stringValue>]  
[-field <stringValue>]  
[-geom <stringValue>]  
[-materials <stringList> | -regions <stringList>]  
[-ranges {<x1> <x2> <y1> <y2> [<z1> <z2>]} 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-min | -max</td><td>Selects whether the point returned will be the minimum or maximum value.</td></tr><tr><td>-dataset &lt;stringValue&gt; | -plot &lt;stringValue&gt;</td><td>Selects either the dataset (for batch mode only) or the plot from which the data should be extracted.</td></tr><tr><td>-field &lt;stringValue&gt;</td><td>Name of the field from which the data will be obtained. If not specified, the command uses the current contour-band field displayed in the plot.</td></tr><tr><td>-geom &lt;stringValue&gt;</td><td>Selects the geometry from which the data will be extracted.</td></tr><tr><td>-materials &lt;stringList&gt; | -regions &lt;stringList&gt;</td><td>Sets a list of materials or regions that will be used to find the minimum or maximum value.</td></tr><tr><td>-ranges {{x1} &lt;x2&gt; &lt;y1} &lt;y2&gt; {{z1} &lt;z2}]</td><td>Sets a specific range of values to find the minimum or maximum value. After the command is executed, the minimum or maximum value and its position are returned.</td></tr></table>

# Returns

Double and a list of coordinate values.

# Example

```yaml
calculate_field_value -plot Plot_n9_des \
- field Abs(TotalCurrentDensity-V) -min
# position:
# min: 271.172 5.39062 0 value 0.0206237 
```

max: 277 -0.546875 0 value 426.765 $\#->0.0206237318885$ {271.172 5.39062 0}

# calculate_scalar

Calculates a scalar value.

This command operates over curves or variables. If -curves is specified, -plot can specify a plot in memory. Otherwise, the command uses the curve in the selected plot.

# Note:

This command applies to xy plots only.

# Syntax

```txt
calculate Scalar  
(-curves [-plot <stringValue>] | -variables)  
-function <stringValue> 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-curves | -variables</td><td>Select whether the command parses the specified formula as a function of curves or variables.</td></tr><tr><td>-function &lt;stringValue&gt;</td><td>Specifies a formula to be used to extract a scalar value. All mathematical operations can be used; however, you must ensure that the last operation that encloses the entire set of functions is a scalar value function. Otherwise, the command fails. For information about which functions return a double value (calars), see Appendix D on page 405.</td></tr><tr><td>-plot &lt;stringValue&gt;</td><td>Name of the plot where the command will search for curves. If not specified, the command uses the selected xy plot.</td></tr></table>

# Returns

Double.

# Example

```txt
calculateScalar -curves -plot Plot_1 \  
- function vecmax(<Curve_1>) + vecmin(<Curve_1>)  
#-> 0.000351277048757
```

# create_curve

Creates a new curve for an xy plot.

If -plot is not specified, the command draws the curve on the selected plot. If there are no xy plots created or the selected plot is not an xy plot, the command returns an error.

# Note:

This command applies to xy plots only.

# Syntax

```txt
create_shape
- dataset <stringList> -axisX <stringValue>
(-axisY <stringValue> | -axisY2 <stringValue>) |
- function <stringValue>
[-name <stringValue>] [-plot <stringValue>] [-y <intValue>] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-dataset &lt;stringList&gt; | -function &lt;stringValue&gt;</td><td>Specify either a list of dataset names where the information is extracted or a formula from which to create a curve.</td></tr><tr><td>-axisX &lt;stringValue&gt;</td><td>Specifies the variable to be used for the x-axis.</td></tr><tr><td>-axisY &lt;stringValue&gt; | -axisY2 &lt;stringValue&gt;</td><td>Specifies the variable to be used for the y-axis or the y2-axis.</td></tr><tr><td>-name &lt;stringValue&gt;</td><td>Name of the new curve. If not specified, the command assigns a default curve name. See Object Names: -name Argument on page 213.</td></tr><tr><td>-plot &lt;stringValue&gt;</td><td>Name of the plot where the new curve will be displayed. If not specified, the command draws the curve on the selected xy plot.</td></tr><tr><td>-y &lt;intValue&gt;</td><td>Specifies whether a function is created against a particular axis: 
• -y 1 specifies the y-axis. 
• -y 2 specifies the y2-axis. 
This argument works only with -function.</td></tr></table>

# Returns

List.

# Example

```batch
createCurve -plot Plot_1 -dataset IdVd_example \
-axisX "drain OuterVoltage" \
-axisY "drain TotalCurrent" 
```

# create_cut_boundary

Creates a cutline along the specified structure boundary.

The command produces a list of line segments that define the cutline. A segment is defined as the union of two vertices, where a vertex is a point that defines a region (angle $> 3 0 ^ { \circ }$ with its neighboring points).

If -plot or -dataset is not specified, the command uses the selected 2D plot dataset or free cutplane.

# Note:

This command applies to 2D plots and free cutplanes only.

# Syntax

```txt
create_cut_boundary  
(-materials <stringList> | -regions <stringList>)  
-points <pointList>  
[-dataset <stringValue> | -plot <stringValue>] [-name <stringValue>]  
[-reverse] [-segments <stringList>] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-materials | -regions</td><td>Materials or regions to which the boundary belongs.</td></tr><tr><td>-points</td><td>Vertices on the boundary through which the outline will pass. Points must be defined as: {"x0 y0 [z0]" "x1 y1 [z1]" ...}Any component not present in the plot must be set to 0.</td></tr><tr><td>-dataset | -plot</td><td>Specifies the plot or dataset from which to retrieve the regions or materials. If not specified, the command uses the selected plot.</td></tr><tr><td>-name</td><td>Name of the outline dataset. If not specified, the command generates a default name. See Object Names: -name Argument on page 213.</td></tr><tr><td>-reverse</td><td>Reverses the direction of the outline creation backwards.</td></tr><tr><td>-segments &lt;stringList&gt;</td><td>Specifies the regions from which the data will be extracted in each segment line. The length of the list must be exactly the number of vertices along the cutline minus 1.</td></tr></table>

# Returns

String (the name of the resultant 1D dataset).

# Example

```txt
create_cut_bound -plot Plot_2D -regions {R.Gateox R.PolyReox} \  
-segments {R.Gateox R.PolyReox}  
-points {"-0.5125 -0.002 0" "-0.6 -0.002 0" "-0.6 0 0"} -name myCut  
#->myCut 
```

# create_cutline

Creates a new cutline.

If the type of cutline is aligned to an axis, you must specify the -at argument.

If -type free is specified, you must specify the -points argument.

The new plot created has the same name as the cutline dataset, with the prefix Plot_.

# Note:

This command applies to 2D and 3D plots only. Axis-aligned cutlines can be generated from 3D plots only if they are particle Monte Carlo (PMC) structures, even though they accept only -type free cutlines.

# Syntax

```txt
create Outline
type x | y | z
-at <doubleValue> [-axisX x | y | z [-surface]] |
-type free -points {<x1> <y1> [<z1>] <x2> <y2> [<z2>]}
[-dataset <stringValue> | -plot <stringValue>] 
[-materials <stringList> | -regions <stringList>] 
[-name <stringValue>] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-at &lt;doubleValue&gt;[-axisX x | y | z [-surface]] | -points {x1&gt;&lt;y1&gt;[z1]&lt;x2&gt;&lt;y2&gt;[z2&gt;]</td><td>If an axis is selected using -type, the -at argument must be used. If -type free is specified, two (x,y) points must be specified with the -points argument. (In 3D plots, you must specify two (x,y,z) points.)If the source structure is a 3D PMC structure, you can specify -surface to extract the surface data as a 1D dataset.If -surface is specified, -axisX sets the reference axis against which curves are displayed.</td></tr><tr><td>-type x | y | z | free</td><td>Selecting x,y, or z ties the outline to the specified axis. The free option allows you to create a outline, drawing a line between two (x,y) coordinates.</td></tr><tr><td>-dataset &lt;stringValue&gt; | -plot &lt;stringValue&gt;</td><td>Name of the dataset or plot from where the outline is generated. If neither is specified, the command uses the selected 2D or 3D plot dataset.</td></tr><tr><td>-materials &lt;stringList&gt; | -regions &lt;stringList&gt;</td><td>If specified, the outline operation is performed only on the materials or regions listed.</td></tr><tr><td>-name &lt;stringValue&gt;</td><td>Name of the new outline dataset. If not specified, the command generates a default name. See Object Names: -name Argument on page 213.</td></tr></table>

# Returns

String (the name of the resultant 1D dataset).

# Example

```txt
create Outline -plot Plot_2D -type free -points \{-0.45 -0.15 0.30 0.80\} \name myOutlineDataset
#-> myOutlineDataset 
```

# create_cutplane

Creates a new cutplane.

The new plot created has the name of the cutplane. If -plot or -dataset is not specified, the command uses the selected 3D plot dataset.

# Note:

This command applies to 3D plots only.

# Syntax

```txt
create-cutplane
- type x | y | z | free -at <doubleValue>
- type free -origin {<x> <y> <z>} -normal {<x> <y> <z}
[-dataset <stringValue> | -plot <stringValue>] [-name <stringValue>] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-at | doubleValue&gt; | -origin { &lt;x&gt; &lt;y&gt; &lt;z&gt;} -normal {&lt;x&gt; &lt;y&gt; &lt;z&gt;}</td><td>With -at, cuts the structure at the value specified in the axis defined by -type (it must not be free). With -origin and -normal, cuts the structure with a plane defined by the given origin and normal. The argument -type must be free.</td></tr><tr><td>-type x | y | z | free</td><td>Selects the axis from which the cutplane is generated.</td></tr><tr><td>-dataset | stringValue&gt; | -plot | stringValue&gt;</td><td>Name of the dataset or plot from where the cutplane is generated. If not specified, the command uses the selected plot.</td></tr><tr><td>-name | stringValue&gt;</td><td>Name of the new cutplane dataset. If not specified, the command generates a default name as a function of the original 3D dataset. See Object Names: -name Argument on page 213.</td></tr></table>

# Returns

String (the name of the resultant 2D dataset).

# Example

```txt
create-cutplane -plot Plot_3D -name Cut1 -type y -at 0.3  
##-> Cut1 
```

# create_cutpolyline

Creates a new cutline with the specified number of vertex points.

# Note:

This command applies to 2D plots only.

# Syntax

```erlang
create_cutpolyline -points <pointList>  
[-dataset <stringValue> | -plot <stringValue>]  
[-materials <stringList> | -regions <stringList>]  
[-name <stringValue>] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-points</td><td>Points in the region where the outline will pass through. Points must be defined as {&quot;x0 y0&quot; &quot;x1 y1&quot; ...}.</td></tr><tr><td>-dataset</td><td>Name of the dataset or plot from where the outline will be created. If neither is specified, the command uses the selected 2D plot dataset.</td></tr><tr><td>-plot</td><td>If specified, the outline will be performed only on the materials or regions listed.</td></tr><tr><td>-materials</td><td>Name of the outline. See Object Names: -name Argument on page 213.</td></tr><tr><td>-regions</td><td>If specified, the outline will be performed only on the materials or regions listed.</td></tr><tr><td>-name</td><td>Name of the outline. See Object Names: -name Argument on page 213.</td></tr></table>

# Returns

String.

# Example

```txt
create_cutpolyline -plot Plot_2D \  
- points {"0.05872 -0.260434" "0.46536 -0.034674" "0.26 0.074126"}  
#-> C1(2D) 
```

# create_cutpolyplanes

Creates a series of cutplanes using a polyline as input. The new plot has the name of the cutplane.

# Note:

This command applies to 3D plots only.

# Syntax

```txt
create_cutpolyplanes
    -type x | y | z
    -points <pointList>
    [-dataset <stringValue> | -plot <stringValue>] 
    [-geom <stringValue>] [-name <stringValue>] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-type x | y | z</td><td>Selects the extrusion axis for the polyline defined by the points.</td></tr><tr><td>-points &lt;pointList&gt;</td><td>Sets the vertices for the polyline to be extruded along the chosen axis to create cutplanes. Points must be defined as: { {x0 y0 z0} {x1 y1 z1} ...}</td></tr><tr><td>-dataset &lt;stringValue&gt; | -plot &lt;stringValue&gt;</td><td>Name of the dataset or plot from where the cutplanes will be created. If neither is specified, the command uses the selected 3D plot dataset.</td></tr><tr><td>-geom &lt;stringValue&gt;</td><td>Name of the geometry to use for the cut. If not specified, the command uses the first geometry of the plot.</td></tr><tr><td>-name &lt;stringValue&gt;</td><td>Name of the new dataset. If not specified, the command generates a default name as a function of the original 3D dataset.</td></tr></table>

# Returns

String (the name of the resultant 2D dataset).

# Example

```txt
create_cutpolyplanes -type x
    -points { {0.3 0.1 0.2} {0.1 0.5 1.6} {2.4 0.5 1.3} }
    -plot Plot_3D -name Cut1
#-> Cut1 
```

# create_field

Creates a new field using data from the plot or the dataset specified in the arguments. The command uses the selected 2D or 3D dataset if -plot or -dataset is not specified.

# Note:

This command applies to 2D and 3D plots only.

# Syntax

```txt
create_field -function <stringValue> -name <stringValue> [-dataset <stringValue> | -plot <stringValue> [-geom <stringValue>]] [-show] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-function &lt;stringValue&gt;</td><td>Specifies the function to be evaluated. For a complete list of operations, see Appendix D on page 405.</td></tr><tr><td>-name &lt;stringValue&gt;</td><td>Name of the new field. See Object Names: -name Argument on page 213.</td></tr><tr><td>-dataset &lt;stringValue&gt; | -plot &lt;stringValue&gt; [ -geom &lt;stringValue&gt; ]</td><td>Name of the plot or dataset from where the field is created. If not specified, the command uses the active plot. The argument -geom can be used only with -plot. It specifies the name of the geometry in the plot. If not specified, the command uses the first geometry associated with the plot.</td></tr><tr><td>-show</td><td>Shows immediately the newly created field if specified.</td></tr></table>

# Returns

String.

# Example

```powershell
create_field -name newFld -dataset 3D -function "log(<ElectricField>)"  
#-> newFld 
```

# create_iso

Creates a new iso-geometry using an isovalue from the field of a geometry, or modifies an existing iso-geometry.

# Note:

This command applies to 2D and 3D plots only.

# Syntax

```txt
createiso-field<stringValue> -value <doubleValue>[-color <#rrggbb>] [-geom <stringValue>][-modify | -name <stringValue>][-plot stringValue] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-field</td><td>Selects the field on which the isvalue is used. If not specified, the command uses the current contour band field displayed in the plot.</td></tr><tr><td>-value</td><td>Specifies the isvalue with which to create the new iso-geometry.</td></tr><tr><td>-color</td><td>Specifies the color to be used for the new iso-geometry. If not specified, the command uses the default color (gray).</td></tr><tr><td>-geom</td><td>Name of the geometry in the plot. If not specified, the command uses the first geometry associated with the plot. If -modify is specified, this argument is the name of the iso-geometry to be modified.</td></tr><tr><td>-modify | -name</td><td>Specifies either the name of the new iso-geometry to be created or that the geometry defined by -geom will be modified by the arguments in the command. See Object Names: -name Argument on page 213.</td></tr><tr><td>-plot</td><td>Specifies the plot from which to retrieve the geometry. If not specified, the command uses the selected plot.</td></tr></table>

# Returns

String naming the new geometry or the modified geometry.

# Example

```batch
createIso -plot Plot_3D -geom 3D -field ElectrostaticPotential \ -value 0.0 -name Iso1(3D) -color blue
```

```txt
# -> Isol(3D)
createiso -modify -geom Isol(3D) -value 0.8 -color green
# -> Isol(3D) 
```

# create_plot

Creates an empty xy plot, or creates a plot from 2D or 3D datasets.

# Syntax

```txt
create_plot
-1d | -dataset<stringValue> | -Duplicate<stringValue>
[-name<stringValue}]
[-ref_plot<stringValue}]
[-tdr_state_index<intValue>] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-1d | -dataset&lt;stringValue&gt; | -duplicate&lt;stringValue&gt;</td><td>The arguments are: 
· -1d creates an empty xy plot. 
· -dataset creates a plot from a loaded 1D, 2D, or 3D dataset. 
· -duplicate replicates the properties of the plot in a new plot (applies to xy plots only).</td></tr><tr><td>-name&lt;stringValue&gt;</td><td>Name of the new plot. See Object Names: -name Argument on page 213.</td></tr><tr><td>-ref_plot&lt;stringValue&gt;</td><td>Name of the plot to be used as a reference to inherit the fields and the region properties. This argument applies to 2D and 3D plots only.</td></tr><tr><td>-tdr_state_index&lt;intValue&gt;</td><td>The new plot will load only the specified TDR state index from an already loaded dataset. The resulting plot is not considered be to a multistate plot. This argument applies to 2D and 3D plots only.</td></tr></table>

# Returns

String.

# Example

```txt
create_plot -dataset 3D
##-> Plot_3D 
```

# create_projection

Creates a 2D plot with maximum or minimum values along a 3D plot axis.

The argument -resolution increases the precision of the maximum or minimum calculation. Higher values of resolution lead to longer calculation times.

# Note:

This command applies to 3D plots only.

# Syntax

```txt
create_projection
- field <stringValue>
-function max | min
	-type x | y | z | free
	[-dataset <stringValue> | -plot <stringValue>] [-geom <stringValue>] [-name <stringValue)]
	[-normal <doubleList> | -materials <stringList> ]
		-regions <stringList>
		-window {<x1> <y1> [<z1>] <x2> <y2> [<z2>]}
	[-origin <doubleList>] [-resolution <x>x<y>x<z>] [-width <doubleValue>] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-field</td><td>Name of the field to be projected.</td></tr><tr><td>-function max | min</td><td>Specifies either the maximum values projection or minimum values projection.</td></tr><tr><td>-type x | y | z | free</td><td>Specifies the axis to be projected: 
• x projects a 2D yz plot.
• y projects a 2D xz plot.
• z projects a 2D xy plot.
• free projects a 2D plot using an arbitrary plane.</td></tr><tr><td>-dataset</td><td>Specifies the plot or dataset from which to retrieve the regions or materials. If not specified, the command uses the selected plot.</td></tr><tr><td>-plot</td><td>Geometry that has the given field. If not specified, the command uses the first shown geometry from the selected dataset.</td></tr><tr><td>-geom</td><td>Name of the resultant 2D projection plot. 
See Object Names: -name Argument on page 213.</td></tr><tr><td>-name</td><td>Name of the resultant 2D projection plot. 
See Object Names: -name Argument on page 213.</td></tr><tr><td>-normal | -materials | -regions | -window {x1 &gt; y1 &gt; [z1] x2 &gt; y2 &gt; [z2]}</td><td>For free projection types, -normal sets the normal for the plane. It must contain three values, which will be normalized if required. If -materials or -regions is used, then they specify the materials or regions where the maximum or minimum data will be extracted. If -window is used, then all regions inside that window are selected. If none of these options is specified, then the command uses all regions in the entire domain.</td></tr><tr><td>-origin &lt;doubleList&gt;</td><td>Sets the origin for the plane of free projection types.</td></tr><tr><td>-resolution &lt;x|x|y|x|z&gt;</td><td>Specifies the resolution of the maximum or minimum search data algorithm. If not specified, then -resolution 50x50x50 is used by default.</td></tr><tr><td>-width &lt;doubleValue&gt;</td><td>Sets the width of the domain considered for free projection types.</td></tr></table>

# Returns

String.

# Example

```txt
create_projection -plot Plot_3D -field DopingConcentration \ -function max -normal x -resolution 50x50x50  
#-> Projection_max(3D) 
```

# create_projection_path

Creates a 2D plot with maximum or minimum values extracted from several planes across a path defined by points.

# Note:

This command applies to 3D plots only.

# Syntax

```txt
create_projection_path
- field <stringValue>
-function max | min
-points <pointList>
type x | y | z
[-dataset <stringValue> | -plot <stringValue>] 
[-geom <stringValue>] 
[-name <stringValue>] 
[-resolution <x>x<y>x<z>] 
[-width <doubleList>] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-field</td><td>Name of the field to be projected.</td></tr><tr><td>-function max | min</td><td>Specifies either the maximum values projection or minimum values projection.</td></tr><tr><td>-points</td><td>Specifies the points in the structure defining the path to construct the projection. Points must be defined as: {"x0 y0 z0" "x1 y1 z1" ...}</td></tr><tr><td>-type x | y | z</td><td>Specifies the extrusion axis for the projection. The resulting 2D plot will have the axis selected as the vertical axis.</td></tr><tr><td>-dataset</td><td>Specifies the dataset or plot from which to retrieve the regions or materials. If not specified, the command uses the selected plot.</td></tr><tr><td>-plot</td><td>Specifies the geometry that has the given field. If not specified, the command uses the first shown geometry from the selected dataset.</td></tr><tr><td>-geom</td><td>Name of the resultant 2D projection plot. See Object Names: -name Argument on page 213.</td></tr><tr><td>-name</td><td>Name of the resultant 2D projection plot. See Object Names: -name Argument on page 213.</td></tr><tr><td>-resolution</td><td>Specifies the resolution of the maximum or minimum search data algorithm. If not specified, then -resolution 50x50x50 is used by default.</td></tr><tr><td>-width &lt;doubleList&gt;</td><td>Sets the width for every plane in the path. If not set, then the full extent of the structure is used. If a single value is used, then all planes use the same width extent. A list can be provided to set each plane width individually (the number of width values must equal the number of points minus one).</td></tr></table>

# Returns

String.

# Example

```txt
create_projection_path -plot Plot_3D -field DopingConcentration
type x -function max -resolution 50x50x50 -width {0.1 0.14}
points {"2.5e-05 -0.0669983 0.0378416" "-0.0950691 -0.0272096 0.0251004" "-0.100966 0.00648555 0.0243684"}
```

# create_ruler

Measures the distance between two points.

# Note:

The command applies to 2D and 3D plots only.

# Syntax

```txt
create_ruler -id <intValue> -point1 {x y [z]} -point2 {x y [z]} [-plot <stringValue>] [-snap_on | -snap_off] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-id &lt;IntValue&gt;</td><td>Specifies the ID of the new ruler to be created.</td></tr><tr><td>-point1 {x y [z]}</td><td>Specifies the first point of the ruler.</td></tr><tr><td>-point2 {x y [z]}</td><td>Specifies the second point of the ruler.</td></tr><tr><td>-plot &lt;stringValue&gt;</td><td>Name of the plot where the command will measure the distance between two points. If not specified, the command uses the selected plot.</td></tr><tr><td>-snap_on | -snap_off</td><td>Specifies whether to activate the snap-to-mesh feature.</td></tr></table>

# Returns

The distance between the ruler points.

# Example

```txt
create_ruler -id 2 -point1 {0.1 0.1 0.1} -point2 {0.5 0.5 0.2} -snap_off
##-> 0.574456264654 
```

# create_streamline

Creates a new streamline on a 2D or 3D plot.

# Note:

The command applies to 2D and 3D plots only.

# Syntax

```txt
create_STREAMline
- direction forward | backward | both
- field <stringValue>
(-point {<x> <y> [<z>]} | -p1 {<x> <y> [<z>]} -p2 {<x> <y> [<z>]} -nofpoints <intValue})
[-geom <stringValue)]
[-integ_initial_step <doubleValue}]
[-integ_max_propagation <doubleValue}]
[-integ_max_steps <intValue]
[-integ-terminal_speed <doubleValue]
[-materials <stringList> | -regions <stringList>
[-name <stringValue>] [-plot <stringValue>] 
```

# Argument

# Description

-direction forward | backward | both

Direction of the streamline created. Default: both.

-field <stringValue>

Selects the field on which the streamline is created.

-point $\{<  x > <  y > [<  z > ]\}$ -p1 $\{<  x > <  y > [<  z > ]\}$ -p2 $\{<  x > <  y > [<  z > ]\}$ -nofpoints<intValue>

Use the -point argument to create one streamline as follows:

• If the direction is forward, the point specified is the starting point of the streamline.   
• If the direction is backward, the point specified is the end point of the streamline.   
• If the direction is both, the point specified is the middle of the streamline.

Use the -nofpoints argument to create a custom number of streamlines going from point 1 to point 2 with the -p1 and -p2 arguments. For example, if you specify -nofpoints 9, then 7 streamlines in addition to the streamlines originating from point 1 and point 2 are created. Analogous to the -point argument, the direction determines the type of point.

-geom <stringValue>

Name of the geometry in the plot. If not specified, the command uses the first geometry associated with the plot.

-integ_initial_step <doubleValue>

Specifies the initial step used in all the calculations of the Runge-Kutta 4 algorithm. This step remains unchanged in all the mathematical processes.

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-integer_max_propagation</td><td rowspan="2">Maximum propagation is the maximum length of the streamline after calculating the magnitude of each step iteration. This is related to the &#x27;line&#x27; length at the calculation level. This represents the maximum amount of data that will be calculated to generate a line of &#x27;x&#x27;-length. However, you can represent the line with less data using the -line_resolution argument of the set_STREAMline_prop command. The value of -line_resolution must not be less than the value of -integer_max_propagation. Otherwise, it can lead to unexpected results.</td></tr><tr><td>&lt;doubleValue&gt;</td></tr><tr><td>-integer_max_steps</td><td rowspan="2">Specifies the number of iterations of the Runge-Kutta 4 algorithm to be applied.</td></tr><tr><td>&lt;intValue&gt;</td></tr><tr><td>-integer-terminal_speed</td><td rowspan="2">For each iteration, the Runge-Kutta 4 algorithm calculates the differential value of the vector field in the point and, using the Picard-Lindelöf iteration method, this value is equal to the speed value of the field in that point. This argument specifies the &#x27;terminal speed&#x27; of the algorithm. If the next result iteration of the Runge-Kutta 4 algorithm is lower than this value, the integration stops.</td></tr><tr><td>&lt;doubleValue&gt;</td></tr><tr><td>-materials</td><td>Specify either: · Materials on which the streamline will be created. Default: All materials. · Region on which the streamline will be created. Default: All regions.</td></tr><tr><td>regions</td><td>Identifier for the new streamline created. If not specified, the command generates a default name. See Object Names: -name Argument on page 213.</td></tr><tr><td>-name</td><td rowspan="2">Name of the plot. If not specified, the command uses the selected plot.</td></tr><tr><td>&lt;stringValue&gt;</td></tr><tr><td>-plot</td><td>Name of the plot. If not specified, the command uses the selected plot.</td></tr></table>

# Returns

List.

# Example

create_streamline -field ElectricField -point {0.5 0.2} -direction both #-> Streamline_1

# create_surface

Creates a new 3D dataset using a 2D dataset or geometry of a plot as source, or modifies an existing 3D surface dataset.

# Note:

This command applies to 2D datasets (or plots) and 3D surface datasets (or plots) only.

# Syntax

```txt
create(surface
[-dataset <stringValue> | -plot <stringValue> [-geom <stringValue>] ]
[-factor <doubleValue> ] [-field <stringValue> ] [-name <stringValue> ]
[-range <doubleList> ] [-scale linear | logabs | asinh] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-dataset &lt;stringValue&gt;</td><td>Specifies the dataset to be used to build the surface dataset.</td></tr><tr><td>-factor &lt;doubleValue&gt;</td><td>Specifies the factor that is used to multiply the coordinate to generate the surface. If not specified, the command uses one (1).</td></tr><tr><td>-field &lt;stringValue&gt;</td><td>Selects the field on which the surface is used. If not specified, the command uses the current contour band field displayed in the plot.</td></tr><tr><td>-geom &lt;stringValue&gt;</td><td>Name of the geometry in the plot. If not specified, the command uses the first geometry associated with the plot.</td></tr><tr><td>-name &lt;stringValue&gt;</td><td>Name of the surface dataset to be created. See Object Names: -name Argument on page 213.</td></tr><tr><td>-plot &lt;stringValue&gt;</td><td>Specifies the plot from which to retrieve the geometry. If the plot is not specified, the command uses the selected plot.</td></tr><tr><td>-range &lt;doubleList&gt;</td><td>Pair of values (min and max) that defines the range to be used to limit the new coordinate values that generate the surface. If not specified, the command uses the entire range of the field.</td></tr><tr><td>-scale linear | logabs | asinh</td><td>Specifies the scale to be used on the coordinates to generate the surface dataset. If not specified, the command uses the linear scale.</td></tr></table>

# Returns

String naming the new dataset.

# Example

```txt
create_SURFACE -plot Plot_2D -geom 2D -field ElectrostaticPotential \
-factor 0.2 -name Surface1(2D)
#-> Surface1(2D)
```

# create_variable

Creates a new variable.

# Note:

This command applies to xy plots only.

# Syntax

```txt
create_variable
    -dataset <stringValue>
    (-function <stringValue> | -values <doubleList>) 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-dataset</td><td>Dataset from which values are obtained to evaluate functions.</td></tr><tr><td>-function</td><td rowspan="2">Expression to evaluate or the list of values to add to the dataset specified.</td></tr><tr><td>-values</td></tr><tr><td>-name</td><td>Name of the new variable. See Object Names: -name Argument on page 213.</td></tr></table>

# Returns

String.

# Example

```batch
create_variable -name nVar -dataset idvd -values {0.1 0.3 0.5 0.7 0.9}  
--> nVar 
```

# diff_plots

Creates a new dataset with the difference in the common fields of the selected plots.

# Note:

This command applies to 2D and 3D plots only.

# Syntax

diff_plots <stringList> [-display] [-normalized]

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringList&gt;</td><td>List of plots to use to create the differential plot.</td></tr><tr><td>-display</td><td>Creates a new plot with the field difference dataset.</td></tr><tr><td>-normalized</td><td>Normalize the values between the two plots.</td></tr></table>

# Returns

String.

# Example

```erlang
diff_plots {Plot1 Plot2}  
--> Plot1-Plot2 
```

# draw_ellipse

Draws an ellipse at the specified position. The ellipse is represented in relation to the rectangle that envelops it, although the rectangle is not drawn.

# Note:

This command applies to xy plots only.

# Syntax

```txt
drawellipse -p1{<x1><y1>} -p2{<x2><y2>} [-plot<stringValue>]
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-p1 {&lt;x1&gt; &lt;y1&gt;}</td><td>Specifies the upper-left corner of the rectangle that envelops the ellipse.</td></tr><tr><td>-p2 {&lt;x2&gt; &lt;y2&gt;}</td><td>Specifies the lower-right corner of the rectangle that envelops the ellipse.</td></tr><tr><td>-plot &lt;stringValue&gt;</td><td>Name of the plot where the ellipse will be drawn. If not specified, the command uses the selected plot.</td></tr></table>

# Returns

Returns a string naming the ellipse. The ellipse will be numbered if other ellipses are already drawn.

# Example

```txt
drawellipse -plot Plot_XY -p1{0 0.5} -p2{0.75 0.25}  
```python
drawEllipse_1 
```

# draw_line

Draws a line connecting two points.

# Note:

This command applies to xy and 2D plots only.

# Syntax

```txt
draw_line -p1 <doubleList> -p2 <doubleList> [-plot <stringValue>] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-p1 &lt;doubleList&gt;</td><td>List of double values representing a point in the plot. This point is the first point of the line.</td></tr><tr><td>-p2 &lt;doubleList&gt;</td><td>List of double values representing a point in the plot. This point is the second point of the line.</td></tr><tr><td>-plot &lt;stringValue&gt;</td><td>Name of the plot in which the line will be drawn.</td></tr></table>

# Returns

Returns a string naming the line. The line will be numbered if other lines are already drawn.

# Example

```txt
draw_line -plot Plot_n9_des -p1 {62.9161 49.8411} -p2 {138.117 60.5841}  
#-> Line_1 
```

# draw_rectangle

Draws a rectangle in the current plot.

# Note:

This command applies to xy and 2D plots only.

# Syntax

```txt
draw Rectangle -p1 <doubleList> -p2 <doubleList> [-plot <stringValue>] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-p1 &lt;doubleList&gt;</td><td>List of double values representing the upper-left corner of the rectangle.</td></tr><tr><td>-p2 &lt;doubleList&gt;</td><td>List of double values representing the lower-right corner of the rectangle.</td></tr><tr><td>-plot &lt;stringValue&gt;</td><td>Name of the plot in which the rectangle will be drawn.</td></tr></table>

# Returns

Returns a string naming the rectangle. The rectangle will be numbered if other rectangles are already drawn.

# Example

```txt
draw Rectangle -plot Plot_n9_des -p1 {46.0341 38.0749} \ -p2 {97.1916 112.253}   
#-> Plane_1 
```

# draw_textbox

Draws a text box with a label at a position indicated by the -at argument, and inserts an arrow that points to the direction of the text box indicated by the -anchor argument.

# Note:

This command applies to xy and 2D plots only. The arrow and its properties work only in 2D plots.

# Syntax

draw_textbox -at <doubleList> -label <stringValue>

[-anchor <doubleList>] [-plot <stringValue>]

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-at &lt;doubleList&gt;</td><td>List of two double values indicating the lower-right corner of the text box.</td></tr><tr><td>-label &lt;stringValue&gt;</td><td>Specifies the text to be displayed in the text box.</td></tr><tr><td>-anchor &lt;doubleList&gt;</td><td>List of double values representing a position where the arrow will point to.</td></tr><tr><td>-plot &lt;stringValue&gt;</td><td>Name of the plot in which the text box will be drawn.</td></tr></table>

# Returns

Returns a string naming the text box. The text box will be numbered if other text boxes are already drawn.

# Example

draw_textbox -at {219.458 41.6559} -anchor {219.458 41.1443} -label Text #-> Text

# echo

Prints a string in the Console.

# Syntax

echo [<stringValue>]

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringValue&gt;</td><td>Specify the text to be printed in the Console.</td></tr></table>

# Returns

None.

# Example

echo "Hello World"

#-> Hello World

# exit

Exits Sentaurus Visual with the status given as an argument.

# Syntax

exit [<intValue>]

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;intValue&gt;</td><td>Exit code as an integer. Default: 0.</td></tr></table>

# Returns

None.

# Example

exit 1 #-> Exit status: 1

# export_curves

Exports a curve to the specified file format.

# Syntax

```txt
export.curves -filename <stringValue> -plot <stringValue>[<stringList>] [-format csv | plx] [-overwrite] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-filename</td><td>Name of the exported file or files.</td></tr><tr><td>-plot</td><td>Exports the curves from the specified plot.</td></tr><tr><td>&lt;stringList&gt;</td><td>Specifies a list of curves to be exported.</td></tr><tr><td>-format csv | plx</td><td>Format of the output file. Default: csv.</td></tr><tr><td>-overwrite</td><td>Overwrites existing files if specified.</td></tr></table>

# Returns

Integer.

# Example

```txt
export.curves -plot Plot_1 -filename testFile.csv -format csv
##-> 0
```

# export_movie

Creates a new movie by exporting the selected frames into a GIF file.

# Note:

You must use the start_movie and add_frame commands before using the export_movie command.

# Syntax

```txt
export/movie -filename <stringValue>  
[-frame_duration <intValue>]  
[-frames <stringList>] [-overwrite] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-filename</td><td>Name of the file for the new movie. Add .gif extension if necessary.</td></tr><tr><td>-frame_duration</td><td>Specifies the duration of each frame with 1/100 s as unit. Default: 50.</td></tr><tr><td>-frames</td><td>Specifies a list of frames to be exported. The entire frame buffer is used by default.</td></tr><tr><td>-overwrite</td><td>Overwrites existing files if specified.</td></tr></table>

# Returns

# Example

```txt
export/movie -filename Movie.gif -frame_duration 2 -overwrite
##-> Movie.gif 
```

# See Also

add_frame on page 218 start_movie on page 382

# export_settings

Exports Sentaurus Visual settings to a file.

# Syntax

export_settings <stringValue>

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringValue&gt;</td><td>Specifies the name of the file. It must have the file extension .conf.</td></tr></table>

# Returns

Integer.

# Example

export_settings settings.conf #-> 0

# export_variables

Exports variables from a curve to a file.

# Syntax

export_variables -dataset <stringValue> -filename <stringValue> [-overwrite] [<stringList>]

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-dataset</td><td>Specifies the name of the dataset where specified variables (by default, all) are read for export.</td></tr><tr><td>-filename</td><td>Specifies the path of the exported file.</td></tr><tr><td>-overwrite</td><td>Overwrites existing files if specified.</td></tr><tr><td>&lt;stringList&gt;</td><td>Specifies a list of variables to be saved. If not specified, the command exports all variables from the dataset provided.</td></tr></table>

# Returns

Integer.

# Example

export_variables -dataset Data_1 -filename exportedVars.csv #-> 0

# export_view

Exports a plot to the specified file format.

If -plots is used, the command exports only the specified plots. If it is not specified, the command exports all plots.

# Syntax

```txt
export_view <stringValue>  
[-format <stringValue>] [-overwrite] [-plots <stringList>]  
[-resolution <width>x<height>] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringValue&gt;</td><td>Name of the exported file or files.</td></tr><tr><td>-format &lt;stringValue&gt;</td><td>Specifies the type of file format to use when exporting the plots. The supported formats are BMP, EPS, JPEG, JPG, PNG, PPM, TIF, TIFF, XBM, and XPM.</td></tr><tr><td>-overwrite</td><td>Overwrites existing files if specified.</td></tr><tr><td>-plots &lt;stringList&gt;</td><td>Exports the list of plots specified. If not specified, the command exports all the plots.</td></tr><tr><td>-resolution &lt;width&gt;x&lt;height&gt;</td><td>Specifies the output resolution in pixels.</td></tr></table>

# Returns

Integer.

# Example

export_view /path/to/examplePlot.bmp -format bmp #-> 0

# extract_path

Extracts the path of the minimum or maximum values of a scalar field. This command returns the name of a new geometry that is added automatically to the plot. See Extracting the Path of Minimum or Maximum Values of a Scalar Field on page 191.

# Syntax

```txt
extract_path <stringValue> -max | -min  
[-bottom <doubleValue>] [-geom <stringValue>]  
[-materials <stringList] | -regions <stringList]  
[-plot <stringValue>] [-points <pointList>]  
[-start {<x> <y> <z} -end {<x> <y> <z}]  
[-top <doubleValue>] [-type x | y | z]  
[-window {<x1> <y1] <z1> <x2> <y2]}} 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringValue&gt;</td><td>Name of the scalar field whose values are extracted along a path.</td></tr><tr><td>-max | -min</td><td>Specifies whether the command extracts the maximum or minimum values of the scalar field.</td></tr><tr><td>(bottom &lt;doubleValue&gt;</td><td>Sets the axis coordinate of the bottom face of the extruded polygon.</td></tr><tr><td>-geom &lt;stringValue&gt;</td><td>Specifies the dataset (or geometry) where the command will search for the scalar field. If not specified, the command uses the main one from the active plot.</td></tr><tr><td>-materials &lt;stringList&gt; | -regions &lt;stringList&gt;</td><td>Specifies either a list of materials or a list of regions where the field values will be extracted. If not specified, the command uses the entire plot.</td></tr><tr><td>-plot &lt;stringValue&gt;</td><td>Name of the plot. If not specified, the command uses the selected plot.</td></tr><tr><td>-points &lt;pointList&gt;</td><td>Specifies the coordinates of each vertex of the polygon to extrude. The list of coordinates must be ordered since each point will be interpolated.</td></tr><tr><td>-start {&lt;x&gt; &lt;y&gt; &lt;z&gt;}</td><td rowspan="2">Specifies the start point and the end point of the 3D path to be extracted. Available for 3D plots only.</td></tr><tr><td>-end {&lt;x&gt; &lt;y&gt; &lt;z&gt;}</td></tr><tr><td>-top &lt;doubleValue&gt;</td><td>Sets the axis coordinate of the top face of the extruded polygon.</td></tr><tr><td>-type x | y | z</td><td>Selects the axis where the polygon specified by -points should be extruded.</td></tr><tr><td>-window {x1&gt; y1&gt; [&lt;z1&gt;] 
    &lt;x2&gt; &lt;y2&gt; [&lt;z2&gt;]}</td><td>Specifies a window defined by x1, y1, [z1] and x2, y2, [z2]. 
These values must be specified in Cartesian coordinates. If not specified, the command uses the entire plot.</td></tr></table>

# Returns

String.

# Example

```txt
extract_path ElectrostaticPotential -plot Plot_2D -geom 2D \
-materials {Oxide Silicon} -window \{-10.32 0 10 10\} -max
##-> PathGeometry_2D 
```

# extract_streamlines

Extracts the fields and coordinates data from one or more streamlines created in 2D or 3D plots.

# Note:

This command applies to 2D and 3D plots only.

# Syntax

extract_streamlines <stringList> [-plot <stringValue>]

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringList&gt;</td><td>Specifies a list of streamlines from which to extract data.</td></tr><tr><td>-plot</td><td>Name of the plot. If not specified, the command uses the selected plot.</td></tr></table>

# Returns

List (names of the 1D datasets created).

# Example

```txt
extract_STREAMlines {Streamline} -plot Plot_2D
#-> {Streamline(Plot_2D)} 
```

# extract_value

Calculates the minimum and maximum field value of a defined polyhedron and shows (with a marker) the location of these values.

# Note:

This command applies to 3D plots only.

# Syntax

```txt
extract_value -min | -max  
[ -bottom <doubleValue> ] [-dataset <stringValue>]  
[ -field <stringValue> ] [-geom <stringValue>]  
[ -materials <stringList> | -regions <stringList>]  
[ -plot <stringValue> ] [-points <pointList>]  
[ -top <doubleValue> ] [-type x | y | z] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-min | -max</td><td>Selects whether the point returned is the minimum or maximum value.</td></tr><tr><td>(bottom &lt;doubleValue&gt;</td><td>Sets the value of the height bottom of the vertical axis of the polyhedron.</td></tr><tr><td>-dataset &lt;stringValue&gt;</td><td>Selects the dataset (for batch mode only) from which the data should be extracted.</td></tr><tr><td>-field &lt;stringValue&gt;</td><td>Name of the field from which the data is obtained. If not specified, the command uses the current contour-band field displayed in the plot.</td></tr><tr><td>-geom &lt;stringValue&gt;</td><td>Selects the geometry from which the data is extracted.</td></tr><tr><td>-materials &lt;stringValue&gt; | -regions &lt;stringList&gt;</td><td>Sets a list of materials or regions that will be used to find the minimum or maximum value.</td></tr><tr><td>-plot &lt;stringValue&gt;</td><td>Selects the plot from which the data should be extracted.</td></tr><tr><td>-points &lt;pointList&gt;</td><td>Selects the points in the structure defining the polygon to construct the polyhedron. Points must be defined as {&quot;x0 y0 z0&quot; &quot;x1 y1 z1&quot; ...}.</td></tr><tr><td>-top &lt;doubleValue&gt;</td><td>Sets the value of the height top of the vertical axis of the polyhedron.</td></tr><tr><td>-type x | y | z</td><td>Specifies the extrusion axis for the polyhedron.</td></tr></table>

# Returns

Double and a list of coordinate values.

# Example

```tcl
extract_value -plot Plot_n10_des -field Abs(TotalCurrentDensity-V)  
-min -type z -top 0.05 -bottom 0  
-points {{0 -0.04 0.05} {0 0.04 0.05} {0.1 0.04 0.05} {0.1 -0.04 0.05}}  
# position:  
# min: 0.00781 0.01 0.00625 value -6.41e+18  
# max: 1.92e-5 0.03 0.05 value 6e+20  
#-> -6.41e+18 {0.00781 0.01 0.00625} 
```

# find_values

Returns the positions of all points with the specified value in a scalar field.

# Note:

This command applies to 2D and 3D plots only.

# Syntax

```txt
find_values <doubleValue> -field <stringValue> [-geom <stringValue>] [-plot <stringValue>] [-window {<x1> <y1> [<z1] <x2> <y2> [<z2>}]} 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;doubleValue&gt;</td><td>Specifies a value that must be found in the field (floating-point number).</td></tr><tr><td>-field &lt;stringValue&gt;</td><td>Name of a scalar field.</td></tr><tr><td>-geom &lt;stringValue&gt;</td><td>Specifies the dataset (or geometry) where the command searches for the scalar field. If not specified, the command uses the main one from the active plot.</td></tr><tr><td>-plot &lt;stringValue&gt;</td><td>Name of the plot. If not specified, the command uses the selected plot.</td></tr><tr><td>-window {{x1} {y1} [&lt;z1&gt;] 
{x2} {y2} [&lt;z2]]}</td><td>Specifies a window whose values must be specified in Cartesian coordinates. If not specified, the command uses the entire geometry.</td></tr></table>

# Returns

Positions of all points in the specified field with the specified value.

# Example

```tcl
find_values 1.0 -field ElectrostaticPotential
#-> {3.53079 -0.0263978 0.392817} {6.41207 -1.7982327 3.289376}
{2.76445 -9.8237643 9.238764}
```

# get_axis_prop

Returns axis properties.

# Note:

The command returns only one property at a time for the specified axis.

# Syntax

```txt
get_axis_prop -axis x | y | z | y2  
(  
    -anchor | -auto(padding | -auto_precision | -auto_spacing |  
    -inverted |  
    -label_angle | -label_font_att | -label_font_color |  
    -label_font_factor | -label_font_family | -label-font_size |  
    -label_format | -label-padding | -label_precision |  
    -major ticks_length | -major ticking_width |  
    -max | -max FIXED | -min | -min FIXED |  
    -min | -min FIXED | -minor ticking_length | -minor ticking_position |  
    -minor ticking_width | -nofMinor ticking | -padding | -range |  
    -show | -showminor ticking | -show_label | -show ticking |  
    -show_title | -spacing | - ticks_position | -title |  
    -title.Font_att | -title.Font_color | -title.Font_factor |  
    -title.Font_family | -title.Font_size | -type  
)  
[-plot <stringValue>] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-axis x | y | z | y2</td><td>Specifies from which axis the properties will be returned. The axis identifier y2 is valid only for xy plots.</td></tr><tr><td>-anchor</td><td>Starting point where ticks are computed.</td></tr><tr><td>-auto(padding</td><td>Shows whether automatic padding of the axis is active (applies to xy plots only).</td></tr><tr><td>-autoPRECISION</td><td>Returns the property if the precision of the axis is automatic.</td></tr><tr><td>-auto_spacing</td><td>Shows if automatic ticks spacing is used.</td></tr><tr><td>-inverted</td><td>Shows inverted axis.</td></tr><tr><td>-label_angle</td><td>Rotation angle applied to the labels of major ticks (applies to xy plots only).</td></tr><tr><td>-label_font_att</td><td>Font attributes of the axis.</td></tr><tr><td>-label_font_color</td><td>Color of the axis.</td></tr><tr><td>-label.Font_factor</td><td>Size factor of the axis (applies to 2D and 3D plots only).</td></tr><tr><td>-label.Font_family</td><td>Font of the axis.</td></tr><tr><td>-label.Font_size</td><td>Font size of the axis (applies to xy plots only).</td></tr><tr><td>-label_format</td><td>Numeric format of the axis.</td></tr><tr><td>-label(padding</td><td>Padding of the axis.</td></tr><tr><td>-label_precision</td><td>Precision of the axis.</td></tr><tr><td>-major_ticks_length</td><td>Length of the major ticks.</td></tr><tr><td>-major_ticks_width</td><td>Width of the major ticks (applies to xy plots only).</td></tr><tr><td>-max</td><td>Returns the maximum value of the axis.</td></tr><tr><td>-max.fixed</td><td>Shows whether the maximum value of the axis is fixed.</td></tr><tr><td>-min</td><td>Returns the minimum value of the axis.</td></tr><tr><td>-min.fixed</td><td>Shows whether the minimum value of the axis is fixed.</td></tr><tr><td>-minor_ticks_length</td><td>Length of the minor ticks.</td></tr><tr><td>-minor_ticks_position</td><td>Shows the position of minor ticks (in, out, or center) (applies to 2D plots only).</td></tr><tr><td>-minor_ticks_width</td><td>Width of the minor ticks (applies to xy plots only).</td></tr><tr><td>-nofminor_ticks</td><td>Number of minor ticks on the selected axis.</td></tr><tr><td>-padding</td><td>Padding value of the axis scale, in pixels (applies to xy plots only).</td></tr><tr><td>-range</td><td>Range covered on the axis.</td></tr><tr><td>-show</td><td>Shows axis.</td></tr><tr><td>-showminor_ticks</td><td>Shows minor ticks.</td></tr><tr><td>-show_label</td><td>Shows labels if values for the major ticks are displayed.</td></tr><tr><td>-showTicks</td><td>Shows major ticks.</td></tr><tr><td>-show_title</td><td>Shows title.</td></tr><tr><td>-spacing</td><td>Shows the spacing between two major ticks.</td></tr><tr><td>-ticks_position</td><td>Shows the position of major ticks (in, out, or center).</td></tr><tr><td>-title</td><td>Axis label.</td></tr><tr><td>-title.Font_att</td><td>Font attributes of the axis label.</td></tr><tr><td>-title.Font_color</td><td>Color of the axis label.</td></tr><tr><td>-title.Font_factor</td><td>Font size factor of the axis label (applies to 2D and 3D plots only).</td></tr><tr><td>-title.Font_family</td><td>Font of the axis title.</td></tr><tr><td>-title.Font_size</td><td>Font size of the axis label (applies to xy plots only).</td></tr><tr><td>-type</td><td>Scale type: linear or logarithmic.</td></tr><tr><td>-plot</td><td>Name of the plot from where the axis properties will be returned.</td></tr></table>

# Returns

The value of the queried property.

# Example

```shell
get_axis_prop -axis x -type  
##-> linear 
```

# get_camera_prop

Returns camera properties.

# Note:

The command returns only one property at a time and applies to 3D plots only.

# Syntax

```txt
get_camera_prop   
( -dollyzeeon|-focal_point|-parallel|-position|-rot_color | -rot_size|-rot_width|-rotation_point|-setup | -showRotation_point|-view_angle|-view_up   
） [-plot<stringValue>] 
```

```txt
Argument Description
-dolly_zoom_on Returns whether dolly zoom is switched on.
-focal_point Returns position of the focal point.
-parallel Returns whether parallel projection mode is active.
-position Returns position of the camera.
-rot_color Returns color of the rotation point.
-rot_size Returns size of the rotation point.
-rot_width Returns width of the lines of the rotation point.
-rotation_point Returns position of the rotation point.
-setup Returns the current setup of the camera.
-show(rotation_point Shows rotation point.
-view_angle Shows the actual view angle of the camera in degrees.
-view_up Returns the view-up vector of the camera.
-plot <stringValue> Name of the plot from which to obtain the required property. If not specified, the command uses the selected plot. 
```

# Returns

The value of the queried property.

# Example

```csv
get_camera_prop -position
#-> 3.53079 -0.0263978 0.392817
```

# get_contour_labels_prop

Returns properties of the contour labels.

# Note:

The command returns only one property at a time.

# Syntax

```ocaml
get_contour_labels_prop <stringValue>   
( -anchor | -color.bg | -font_att | -font_color | -font_factor | -font_family | -format | -level Skip | -precision | -show bg | -show_index | -spacing   
) [-geom <stringValue>] [-plot <stringValue>]
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringValue&gt;</td><td>Name of the field. If not specified, then the command uses the active field.</td></tr><tr><td>-anchor</td><td>Anchor of the contour labels.</td></tr><tr><td>-color_bg</td><td>Background color of the contour labels.</td></tr><tr><td>-font_att</td><td>Font attribute of the contour labels.</td></tr><tr><td>-font_color</td><td>Font color of the contour labels.</td></tr><tr><td>-font_factor</td><td>Font multiplier of the contour labels.</td></tr><tr><td>-font_family</td><td>Font type of the contour labels.</td></tr><tr><td>-format</td><td>Numeric format of the contour labels.</td></tr><tr><td>-level.skip</td><td>Returns level skip of the contour labels. The value 0 means every level is labeled.</td></tr><tr><td>-precision</td><td>Precision of the contour labels.</td></tr><tr><td>-show bg</td><td>Shows whether contour labels background is visible.</td></tr><tr><td>-show_index</td><td>Shows whether contour values are shown as indexes.</td></tr><tr><td>-spacing</td><td>Spacing between contour labels in pixels.</td></tr><tr><td>-geom &lt;stringValue&gt;</td><td>Name of the dataset (or geometry). If not specified, then the command uses the main one from the active plot.</td></tr><tr><td>-plot &lt;stringValue&gt;</td><td>Name of the plot. If not specified, then the command uses the active plot.</td></tr></table>

# Returns

The value of the queried property.

# Example

get_contour_labels_prop DopingConcentration -format #-> engineering

# get_curve_data

Returns data from the specified curve axis.

# Syntax

```txt
get(curve_data<stringValue> -axisX | -axisY | -scalar[-plot<stringValue>] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringValue&gt;</td><td>Name of the curve from where data is retrieved.</td></tr><tr><td>-axisX | -axisY | -scalar</td><td>Curve axis or scalar field from where data is retrieved.</td></tr><tr><td>-plot &lt;stringValue&gt;</td><td>Name of plot where curve is displayed.</td></tr></table>

# Returns

The value of the queried property.

# Example

get_curve_data Curve_1 -axisX

#-> 0 0.05 0.1 0.15 0.2 0.25 0.3 0.35 0.4 0.45 0.5

# get_curve_prop

Returns curve properties.

# Note:

The command returns only one property at a time and applies to xy plots only.

# Syntax

```ocaml
getCurve_prop <stringValue>   
( -axis | -color | -deriv | -function | -integer | -label | -line_style | -line_width | -markers_size | -markers_type | -selected | -show | -show_XScale | -xShift | -yScale | -yShift   
) [-plot <stringValue>] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringValue&gt;</td><td>Identifier of the curve.</td></tr><tr><td>-axis</td><td>Shows axis alignment of selected curve (left or right aligned).</td></tr><tr><td>-color</td><td>Shows the selected curve line color.</td></tr><tr><td>-deriv</td><td>Shows the order of the derivative applied to the curve.</td></tr><tr><td>-function</td><td>Shows a function applied to the curve.</td></tr><tr><td>integ</td><td>Shows the integration applied to the curve.</td></tr><tr><td>-label</td><td>Shows the selected curve label.</td></tr><tr><td>-line_style</td><td>Shows the line style of the curve.</td></tr><tr><td>-line_width</td><td>Shows the selected curve line width.</td></tr><tr><td>-markers_size</td><td>Shows the selected curve markers size.</td></tr><tr><td>-markers_type</td><td>Shows the selected curve markers type.</td></tr><tr><td>-selected</td><td>Shows whether the curve is selected.</td></tr><tr><td>-show</td><td>Shows curve.</td></tr><tr><td>-show_hegend</td><td>Shows whether the legend is visible.</td></tr><tr><td>-show_line</td><td>Shows curve line.</td></tr><tr><td>-show/markers</td><td>Shows activated markers.</td></tr><tr><td>-xScale</td><td>Shows the scale of the curve in the x-axis.</td></tr><tr><td>-xShift</td><td>Shows the shift of the curve in the x-axis.</td></tr><tr><td>-yScale</td><td>Shows the scale of the curve in the y-axis.</td></tr><tr><td>-yShift</td><td>Shows the shift of the curve in the y-axis.</td></tr><tr><td>-plot &lt;stringValue&gt;</td><td>Name of the plot. If not specified, the command uses the selected plot.</td></tr></table>

# Returns

The value of the queried property.

# Example

```txt
get Curve_prop Curve_1 -deriv
##-> 2 
```

# get_cutline_prop

Returns the properties of cutlines.

# Note:

This command returns only one property at a time. It applies to 2D and 3D plots only.

# Syntax

```txt
get Outline_prop <stringValue> -plot <stringValue>  
(  
    -handles_color | -hidehandles | -label_op | -label_pos | 
    -label_size | -line_color | -line_style | -line_width | 
    -pos1 | -pos2 | -show Handles | -show_label 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringValue&gt;</td><td>Name of the outline from which the property will be returned.</td></tr><tr><td>-plot</td><td>Name of the plot in which the outline is located.</td></tr><tr><td>-handles_color</td><td>Color of the handles.</td></tr><tr><td>-hidehandles</td><td>Shows whether the handles are hidden.</td></tr><tr><td>-label_op</td><td>The side of the outline where the label is displayed. It returns false (0) if it is the “normal” position or true (1) if it is the opposite position.</td></tr><tr><td>-label_pos</td><td>Position of the label.</td></tr><tr><td>-label_size</td><td>Size of the label.</td></tr><tr><td>-line_color</td><td>Color of the line.</td></tr><tr><td>-line_style</td><td>Style of the line.</td></tr><tr><td>-line_width</td><td>Width of the line.</td></tr><tr><td>-pos1</td><td>Position of the first point.</td></tr><tr><td>-pos2</td><td>Position of the second point.</td></tr><tr><td>-show Handles</td><td>The status of the visibility of the handles.</td></tr><tr><td>-show_label</td><td>The status of the visibility of the label.</td></tr><tr><td>-handles_color</td><td>Color of the handles.</td></tr></table>

# Returns

The value of the queried property.

# Example

```batch
get Outline_prop C1 -plot Plot_2D -pos1  
##-> 0.1 2.7891 0 
```

# get_cutplane_prop

Returns cutplane properties.

Note:

This command applies to 3D plots only.

Syntax

```txt
get_cutplane_prop <stringValue> -plot <stringValue>  
(  
    -at | -hide_label | -label_position | -label_size | -normal |  
    -origin | -show_label  
) 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringValue&gt;</td><td>Name of the cutplane from which the property is returned.</td></tr><tr><td>-plot</td><td>Name of the plot in which the cutplane is located.</td></tr><tr><td>-at</td><td>Position value of an -at type cutplane.</td></tr><tr><td>-hide_label</td><td>Shows whether the label in the cutplane is hidden.</td></tr><tr><td>-label_position</td><td>Position of the label.</td></tr><tr><td>-label_size</td><td>Size of the label.</td></tr><tr><td>-normal</td><td>The normal vector of a free-type cutplane.</td></tr><tr><td>-origin</td><td>The origin vector of a free-type cutplane.</td></tr><tr><td>-show_label</td><td>The status of the visibility of the label.</td></tr></table>

# Returns

The value of the queried property.

# Example

```shell
get_cutplane_prop C1 -plot Plot_3D -at  
##-> 0.483
```

# get_ellipse_prop

Returns ellipse properties.

# Note:

This command returns only one property at a time and applies only to xy plots.

# Syntax

```txt
getellipse_prop <stringValue>  
(-fill_color | -line_color | -line_style | -line_width | -p1 | -p2)  
[-plot <stringValue>] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringValue&gt;</td><td>Name of the ellipse object from which the property will be returned.</td></tr><tr><td>-fill_color</td><td>Returns the color inside of the ellipse.</td></tr><tr><td>-line_color</td><td>Returns the line color.</td></tr><tr><td>-line_style</td><td>Returns the line pattern.</td></tr><tr><td>-line_width</td><td>Returns the line width.</td></tr><tr><td>-p1</td><td>Returns a list of double values representing the start point of the ellipse (upper-left corner).</td></tr><tr><td>-p2</td><td>Returns a list of double values representing the end point of the ellipse (lower-right corner).</td></tr><tr><td>-plot&lt;stringValue&gt;</td><td>Name of the plot. If not specified, the command uses the selected plot.</td></tr></table>

# Returns

The value of the queried property.

# Example

```txt
getellipse_prop Ellipse_1 -plot Plot_1 -line_style  
#-> dashdotdot 
```

# get_field_prop

Returns field properties.

# Note:

The command returns only one property at a time and applies only to 2D and 3D plots.

# Syntax

```txt
get_field_prop [<stringValue>]  
(  
    -contour_labels_on | -custom_levels | -interpolated_values | -label | -levels | -line_color | -line_width | -max | -max_fixed | -min | -min.fixed | -range | -scale | -show | -show_bands  
)  
[ -geom <stringValue> ] [-plot <stringValue>] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringValue&gt;</td><td>Name of the field. If not specified, the command uses the active field.</td></tr><tr><td>-contour_labels_on</td><td>Shows contour labels of the selected field.</td></tr><tr><td>-custom_levels</td><td>Shows custom levels defined for the selected field.</td></tr><tr><td>- interpolated_values</td><td>Returns whether the interpolated values on its vertices are used for visualization (this property is only valid for fields defined on cells).</td></tr><tr><td>-label</td><td>Label of the field.</td></tr><tr><td>-levels</td><td>Levels of the selected field.</td></tr><tr><td>-line_color</td><td>Color of the contour lines.</td></tr><tr><td>-line_width</td><td>Width of the contour lines.</td></tr><tr><td>-max</td><td>Maximum value of the field.</td></tr><tr><td>-max_fix</td><td>Shows whether the maximum value of the field is fixed.</td></tr><tr><td>-min</td><td>Minimum value of the field.</td></tr><tr><td>-min_fix</td><td>Shows whether the minimum value of the field is fixed.</td></tr><tr><td>-range</td><td>Range of the selected field.</td></tr><tr><td>-scale</td><td>Scale of the selected field.</td></tr><tr><td>-show</td><td>Shows the selected field on the plot.</td></tr><tr><td>-show_bands</td><td>Shows bands.</td></tr><tr><td>-geom</td><td>Name of the dataset (or geometry). If not specified, the command uses the main one from the active plot.</td></tr><tr><td>-plot</td><td>Name of the plot. If not specified, the command uses the active plot.</td></tr></table>

# Returns

The value of the queried property.

# Example

```txt
get_field_prop -range
#-> {2.36618e-05 4.36902e+06} 
```

# get_grid_prop

Returns grid properties of a plot.

Note:

The command applies to xy and 2D plots only.

Syntax

```ocaml
get_grid_prop   
( -align | -line1_color | -line1_style | -line1_width | -line2_color | -line2_style | -line2_width | -show | -showminorlines   
） [-plot<stringValue>]
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-align</td><td>Shows plot alignment (applies to xy plots only).</td></tr><tr><td>-line1_color</td><td>Shows color of major lines.</td></tr><tr><td>-line1_style</td><td>Shows style of major lines (applies to xy plots only).</td></tr><tr><td>-line1_width</td><td>Shows width of major lines.</td></tr><tr><td>-line2_color</td><td>Shows color of minor lines.</td></tr><tr><td>-line2_style</td><td>Shows style of minor lines (applies to xy plots only).</td></tr><tr><td>-line2_width</td><td>Shows width of minor lines.</td></tr><tr><td>-show</td><td>Shows major lines.</td></tr><tr><td>-showminorlines</td><td>Shows minor lines.</td></tr><tr><td>-plot &lt;stringValue&gt;</td><td>Name of the plot. If not specified, the command uses the selected plot.</td></tr></table>

# Returns

The value of the queried property.

Example

```tcl
get_grid_prop -line1_color
#-> #ff0000 
```

# get_input_data

Displays a customizable dialog box that requires user input.

# Note:

This command works only in interactive mode. Otherwise, it fails unless a default value is provided.

# Syntax

```tcl
get_input_data [-default <stringValue>] [-desc <stringValue>] [-double | -file | -int | -list | -string | -yesno] [-elements <stringList>] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-default</td><td>Sets the default value of a variable.</td></tr><tr><td>-desc</td><td>Text that describes the input.</td></tr><tr><td>-double | -file | -int | -list | -string | -yesno</td><td>Sets the type of input to be expected. Options are: 
- double: Sets the input to expect a double number. 
- file: Sets the input to be selected from the file dialog box. 
- int: Sets the input to expect an integer. 
- list: Sets the input to be selected from a list. 
-string: Sets the input to expect a string. This is the default if no type input is specified. 
- yesno: Sets the input to expect a Yes or No value. It returns 1 for Yes and 0 for No.</td></tr><tr><td>-elements</td><td>List of possible elements.</td></tr></table>

# Returns

The result of the input as a string.

If you cancel the input, the result is equal to the default value. If a default value is not specified, the command generates an error message.

# Example

```txt
get_input_data -desc "Variable that defines the cut point." \ -default 0.0 -double  
#-> 1.5 
```

# get_legend_prop

Returns legend properties.

Note:

The command returns only one property at a time.

# Syntax

```ocaml
getantlyprop   
( -color.bg | -color.fg | -label.Font_att | -label.Font_color | -label.Font_factor | -label.Font_family | -label.Font_size | -label_format | -location | -margins | -nof_labels | -orientation | -position | -precision | -show/background | -size | -title.Font_att | -title.Font_color | -title.Font_factor | -title.Font_family ) [-plot <stringValue>] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-color_bg</td><td>Background color of the legend.</td></tr><tr><td>-color_fg</td><td>Foreground color of the legend.</td></tr><tr><td>-label.Font_att</td><td>Font attribute of the legend labels.</td></tr><tr><td>-label.Font_color</td><td>Font color of the legend labels.</td></tr><tr><td>-label.Font_factor</td><td>Font multiplier of the legend labels.</td></tr><tr><td>-label.Font_family</td><td>Font type of the legend labels.</td></tr><tr><td>-label.Font_size</td><td>Font size of the legend labels.</td></tr><tr><td>-label_format</td><td>Numeric format of the legend labels.</td></tr><tr><td>-location</td><td>Location in the plot area where the legend is displayed (only for xy plots).</td></tr><tr><td>-margins</td><td>Margins of the legend box.</td></tr><tr><td>-nof_labels</td><td>Number of labels used in the legend.</td></tr><tr><td>-orientation</td><td>Orientation of the legend.</td></tr><tr><td>-position</td><td>Position of the legend that is normalized to the window coordinates between 0 and 1.</td></tr><tr><td>-precision</td><td>Precision of the legend labels.</td></tr><tr><td>-showbackground</td><td>Shows whether legend is transparent.</td></tr><tr><td>-size</td><td>Legend size is normalized to window coordinates.</td></tr><tr><td>-title.Font_att</td><td>Font attribute of the legend title.</td></tr><tr><td>-title.Font_color</td><td>Font color of the legend title.</td></tr><tr><td>-title.Font_factor</td><td>Font multiplier of the legend title.</td></tr><tr><td>-title.Font_family</td><td>Font type of the legend title.</td></tr><tr><td>-plot&lt;stringValue&gt;</td><td>Name of the plot. If not specified, the command uses the selected plot.</td></tr></table>

# Returns

The value of the queried property.

# Example

```txt
get kénd prop -orientation #-> vertical 
```

# get_line_prop

Returns line properties.

# Note:

This command returns only one property at a time and applies only to xy and 2D plots.

# Syntax

```txt
get_line_prop <stringValue>  
(-line_color | -line_style | -line_width | -p1 | -p2)  
[-plot <stringValue>] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringValue&gt;</td><td>Name of the line object from which the property is returned.</td></tr><tr><td>-line_color</td><td>Returns the line color.</td></tr><tr><td>-line_style</td><td>Returns the line pattern (applies only to xy plots).</td></tr><tr><td>-line_width</td><td>Returns the line width in pixels.</td></tr><tr><td>-p1</td><td>Returns a list of double values representing the start point of the line.</td></tr><tr><td>-p2</td><td>Returns a list of double values representing the end point of the line.</td></tr><tr><td>-plot&lt;stringValue&gt;</td><td>Name of the plot. If not specified, the command uses the selected plot.</td></tr></table>

# Returns

The value of the queried property.

# Example

```tcl
get_line_prop Line_1 -plot Plot_1 -line_width
##-> 4
```

# get_material_prop

Returns material properties.

# Note:

The command returns only one property at a time and applies only to 2D and 3D plots.

# Syntax

```ocaml
get_material_prop <stringValue>   
( -border_color | -border_width | -color | -mesh_color | -mesh_width | -on | -particles_size | -show_all | -show_border | -show_bulk | -show_field | -show_mesh | -show_vector | -translucency_level | -translucency_on   
) [-geom <stringValue>] [-plot <stringValue>] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringValue&gt;</td><td>Name of the material.</td></tr><tr><td>-border_color</td><td>Color of material border.</td></tr><tr><td>-border_width</td><td>Width of material border in pixels.</td></tr><tr><td>-color</td><td>Material bulk color.</td></tr><tr><td>-mesh_color</td><td>Color of the material mesh.</td></tr><tr><td>-mesh_width</td><td>Width of the material mesh in pixels.</td></tr><tr><td>-on</td><td>Status of the visibility of the material.</td></tr><tr><td>-particles_size</td><td>Size of the particles.</td></tr><tr><td>-show_all</td><td>Shows the visibility status of the material.</td></tr><tr><td>-show边境</td><td>Shows the visibility status of the material border.</td></tr><tr><td>-show_bulk</td><td>Shows the visibility status of the material bulk.</td></tr><tr><td>-show_field</td><td>Shows the scalar field visibility status of the material.</td></tr><tr><td>-show_mesh</td><td>Shows the visibility status of the material mesh.</td></tr><tr><td>-show_vector</td><td>Shows the status of the vector field visibility of the material.</td></tr><tr><td>-translucency_level</td><td>Translucency level of the material.</td></tr><tr><td>-translucency_on</td><td>Shows whether translucency is activated.</td></tr><tr><td>-geom &lt;stringValue&gt;</td><td>Specifies the geometry from where the material property will be requested. If not specified, the command uses first geometry of given -plot.</td></tr><tr><td>-plot &lt;stringValue&gt;</td><td>Name of the plot from where the material property will be requested. If not specified, the command uses selected plot.</td></tr></table>

# Returns

The value of the queried property.

# Example

get_material_prop Silicon -plot Plot_2D -show_mesh #-> false

# get_plot_prop

Returns plot properties.

Note:

The command returns only one property at a time.

# Syntax

```txt
get_plot_prop   
( -axes_interchanged | -bg-gradient | -caption.Font_size | -caption_leader_on | -caption_material | -color_bg | -color_fg | -color_map | -enable_path_limit | -frame_width | -gradientcolors | -keep_aspect_ratio | -materialcolors | -path_depth | -ratio_xtoy | -show | -show.axes | -show.axes_label | -show.axes_title | -show_cube Axes | -show(curveLines | -show.curve/markers | -show_grid | -showleiend | -showmajorTicks | -show_maxmarker | -show_minmarker | -showminorTicks | -show_path | -show地區s bg | -show_title | -tdr_state | -tdr_state_index | -title | -title.Font_att | -title.Font_color | -title.Font_factor | -title.Font_family | -title.Font_size | -transformation ) [-plot <stringValue>] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-axes_interchanged</td><td>Returns a value indicating whether the axes are interchanged (only for 2D plots).</td></tr><tr><td>-bg-gradient</td><td>Returns a value indicating whether the background displays a gradient (2D and 3D plots only).</td></tr><tr><td>-caption_font_size</td><td>Returns the size of the caption font (3D plots only).</td></tr><tr><td>-caption_leader_on</td><td>Returns whether the leaders of the captions are displayed (3D plots only).</td></tr><tr><td>-caption_material</td><td>Returns whether material names or region names are displayed in the caption.</td></tr><tr><td>-color_bg</td><td>Shows the background color used when a solid background is active.</td></tr><tr><td>-color_fg</td><td>Shows the foreground color used.</td></tr><tr><td>-color_map</td><td>Returns a value indicating whether the color map is in default mode (full palette) or grayscale mode.</td></tr><tr><td>-enable_path_limit</td><td>Returns a value indicating whether the path is limited.</td></tr><tr><td>-frame_width</td><td>Returns a value that is a positive integer less than 8, denoting the frame width in pixels.</td></tr><tr><td>-gradientColors</td><td>Returns a list of colors used when a gradient background is active (2D and 3D plots only).</td></tr><tr><td>-keep_aspect_ratio</td><td>Returns a value indicating whether the aspect ratio is maintained (only for 2D plots).</td></tr><tr><td>-materialColors</td><td>Returns a value indicating whether the color scheme is Classic or Vivid.</td></tr><tr><td>-path_depth</td><td>Returns an integer with the number of path directory names to be displayed in the plot title.</td></tr><tr><td>-ratio_xtoy</td><td>Returns the transformation ratio between the x-axis and y-axis (only for 2D plots).</td></tr><tr><td>-show</td><td>Returns a value indicating whether the plot is displayed.</td></tr><tr><td>-show.axes</td><td>Returns a value indicating whether the axes are present.</td></tr><tr><td>-show Axes_label</td><td>Returns a value indicating whether axes labels are present (only for xy plots).</td></tr><tr><td>-show.axes_title</td><td>Returns a value indicating whether the axes titles are displayed (only for xy plots).</td></tr><tr><td>-show_cube Axes</td><td>Returns a value indicating whether cube axes are displayed (only for 3D plots).</td></tr><tr><td>-show(curve Lines</td><td>Returns a value indicating whether the curve lines are displayed (only for xy plots).</td></tr><tr><td>-show.curve/markers</td><td>Returns a value indicating whether the markers are enabled (only for xy plots).</td></tr><tr><td>-show_grid</td><td>Returns a value indicating whether the grid is displayed (only for xy and 2D plots).</td></tr><tr><td>-showjonder</td><td>Returns a value indicating whether legend is displayed.</td></tr><tr><td>-show_major_ticks</td><td>Returns a value indicating whether the major ticks are displayed (only for 3D plots).</td></tr><tr><td>-show_maxmarker</td><td>Returns a value indicating whether the maximum marker is displayed (only for 2D and 3D plots).</td></tr><tr><td>-show_minmarker</td><td>Returns a value indicating whether the minimum marker is displayed (only for 2D and 3D plots).</td></tr><tr><td>-showminor_ticks</td><td>Returns a value indicating whether the minor ticks are displayed (only for 3D plots).</td></tr><tr><td>-show_path</td><td>Returns a value indicating whether the path is displayed.</td></tr><tr><td>-show_regions.bg</td><td>Returns a value indicating whether the background color of regions is displayed.</td></tr><tr><td>-show_title</td><td>Returns a value indicating whether title is displayed.</td></tr><tr><td>-tdr_state</td><td>Returns the name of the TDR state currently displayed in the plot.</td></tr><tr><td>-tdr_state_index</td><td>Returns the index of the TDR state currently displayed in the plot.</td></tr><tr><td>-title</td><td>Shows the plot label.</td></tr><tr><td>-title.Font_att</td><td>Shows the plot label attribute (normal, bold, italic, underline or strikeout).</td></tr><tr><td>-title.Font_color</td><td>Shows the plot label color used.</td></tr><tr><td>-title.Font_factor</td><td>Returns a value indicating the font factor size (only for 2D and 3D plots).</td></tr><tr><td>-title.Font_family</td><td>Shows the label font family used (arial, courier or times).</td></tr><tr><td>-title.Font_size</td><td>Returns a value indicating the label font size (only for xy plots).</td></tr><tr><td>-transformation</td><td>Shows the transformation used (only for 3D plots).</td></tr><tr><td>-plot</td><td>Name of the plot. If not specified, the command uses the selected plot.</td></tr></table>

# Returns

The value of the queried property.

# Example

```tcl
get_plot_prop -title
##-> Test Plot 
```

# get_rectangle_prop

Returns rectangle properties.

# Note:

This command returns only one property at a time and applies only to xy plots and 2D plots.

# Syntax

```txt
get Rectangle_prop <stringValue>  
(  
    -fill_color | -line_color | -line_style | -line_width | -p1 | -p2  
)  
    [-plot <stringValue>] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringValue&gt;</td><td>Name of the rectangle object from which the property is returned.</td></tr><tr><td>-fill_color</td><td>Returns the color inside of the rectangle.</td></tr><tr><td>-line_color</td><td>Returns the line color.</td></tr><tr><td>-line_style</td><td>Returns the line pattern.</td></tr><tr><td>-line_width</td><td>Returns the line width.</td></tr><tr><td>-p1</td><td>Returns a list of double values representing the start point of the rectangle (lower-left corner in 2D plots or upper-left corner in xy plots).</td></tr><tr><td>-p2</td><td>Returns a list of double values representing the end point of the rectangle (upper-right corner in 2D plots or lower-right corner in xy plots).</td></tr><tr><td>-plot&lt;stringValue&gt;</td><td>Name of the plot. If not specified, the command uses the selected plot.</td></tr></table>

# Returns

The value of the queried property.

# Example

```txt
get Rectangle_prop Rectangle_1 -plot Plot_1 -fill_color
#-> #00FF3B
```

# get_region_prop

Returns region properties.

# Note:

The command returns only one property at a time and applies only to 2D and 3D plots.

# Syntax

```ocaml
get_region_prop <stringValue>   
( -border_color | -border_width | -color | -mesh_color | -mesh_width | -on | -particles_size | -show_all | -show_border | -show_bulk | -show)caption | -show_field | -show_shell | -show_vector | -translucency_level | -translucency_on   
) [-geom <stringValue>] [-plot <stringValue>] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringValue&gt;</td><td>Name of the region.</td></tr><tr><td>-border_color</td><td>Color of region border.</td></tr><tr><td>-border_width</td><td>Width of region border in pixels.</td></tr><tr><td>-color</td><td>Region bulk color.</td></tr><tr><td>-mesh_color</td><td>Color of the region mesh.</td></tr><tr><td>-mesh_width</td><td>Width of the region mesh in pixels.</td></tr><tr><td>-on</td><td>Status of the visibility of the material.</td></tr><tr><td>-particles_size</td><td>Current particles size. Applies only to particle (kinetic Monte Carlo) regions.</td></tr><tr><td>-show_all</td><td>Shows the visibility status of the region.</td></tr><tr><td>-show_border</td><td>Shows the visibility status of the region border.</td></tr><tr><td>-show_bulk</td><td>Shows the visibility status of the region bulk.</td></tr><tr><td>-show_caption</td><td>Shows the visibility status of the region caption.</td></tr><tr><td>-show_field</td><td>Shows the status of the scalar field visibility of the region.</td></tr><tr><td>-show_mesh</td><td>Shows the visibility status of the region mesh.</td></tr><tr><td>-show_vector</td><td>Shows the status of the vector field visibility of the region.</td></tr><tr><td>-translucency_level</td><td>Translucency level of the region.</td></tr><tr><td>-translucency_on</td><td>Shows whether translucency is activated.</td></tr><tr><td>-geom</td><td>Specifies the geometry from where the region property will be requested. If not specified, the command uses the first geometry of the given -plot.</td></tr><tr><td>-plot</td><td>Name of the plot from where the region property will be requested. If not specified, the command uses the selected plot.</td></tr></table>

# Returns

The value of the queried property.

# Example

get_region_prop RGate -plot Plot_2D -border_color #->#0000FF

# get_ruler_prop

Returns ruler properties.

Note:

This command returns only one property at a time.

# Syntax

```txt
get_ruler_prop -color | -pos1 | -pos2 | -precision | -show_label | -snap_on | -width [-id <intValue>] [-plot <stringValue>] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-color</td><td>Color of the ruler.</td></tr><tr><td>-pos1</td><td>First point of the ruler.</td></tr><tr><td>-pos2</td><td>Second point of the ruler.</td></tr><tr><td>-precision</td><td>Decimal precision of the measurements.</td></tr><tr><td>-show_label</td><td>Status of the ruler label.</td></tr><tr><td>-snap_on</td><td>Status of the snap-to-mesh feature.</td></tr><tr><td>-width</td><td>Width of the ruler in pixels.</td></tr><tr><td>-id &lt;intValue&gt;</td><td>The ID of the ruler where the command will search for properties. If not specified, the command uses the last selected ruler.</td></tr><tr><td>-plot &lt;stringValue&gt;</td><td>Name of the plot where the command will search for properties. If not specified, the command uses the selected plot.</td></tr></table>

# Returns

The value of the queried property.

# Example

```txt
get_ruler_prop -width
##-> 4 
```

# get_streamline_prop

Returns the specified property of a streamline.

# Note:

This command applies to 2D and 3D plots only.

# Syntax

```txt
get_STREAMline_prop <stringValue> -plot <stringValue>  
(  
    -arrow_angle | -arrow_color | -arrow_size | -arrow_step |  
    -arrow_style | -arrow_width | -constant_arrow |  
    -line_color | -line_resolution | -line_style |  
    -line_width | -positiveDirection | -show_arrows | -show_line 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringValue&gt;</td><td>Name of the streamline from which the specified property will be returned.</td></tr><tr><td>-plot</td><td>Name of the plot from where the streamline property will be requested. If not specified, the command uses the selected plot.</td></tr><tr><td>-arrow_angle</td><td>Arrowhead angle.</td></tr><tr><td>-arrow_color</td><td>Color of the arrows.</td></tr><tr><td>-arrow_size</td><td>Size of the arrows.</td></tr><tr><td>-arrow_step</td><td>Step between arrows.</td></tr><tr><td>-arrow_style</td><td>Returns the style of the streamline arrowheads.</td></tr><tr><td>-arrow_width</td><td>Width of the arrowheads.</td></tr><tr><td>-constant-arrow</td><td>Returns whether the zoom for the streamline arrowheads is constant in the plot area.</td></tr><tr><td>-line_color</td><td>Color of the line.</td></tr><tr><td>-line_resolution</td><td>Distance between the points that conform the line.</td></tr><tr><td>-line_style</td><td>Line style.</td></tr><tr><td>-line_width</td><td>Width of the line.</td></tr><tr><td>-positiveDirection</td><td>Shows whether the arrow is displayed in the normal view or inverted view.</td></tr><tr><td>-show_arrows</td><td>Shows whether arrows are visible.</td></tr><tr><td>-show_line</td><td>Shows whether the line is visible.</td></tr></table>

# Returns

The value of the queried property.

# Example

```txt
get_STREAMline_prop Streamline_1 -plot Plot_2D -arrow_angle
##-> 30 
```

# get_textbox_prop

Returns the specified property of a text box.

# Note:

This command applies to xy and 2D plots only.

# Syntax

```txt
get_textbox_prop <stringValue>   
( -anchor_pos | -arrow_size | -font_att | -font_color | -font_factor | -font_family | -font_size | -line_color | -line_style | -line_width | -pos | -rotation | -show-anchor | -show_border | -text ) [-plot <stringValue>]
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringValue&gt;</td><td>Name of the text box.</td></tr><tr><td>-anchor_pos</td><td>Returns anchor position using the world coordinate system (only for 2D plots).</td></tr><tr><td>-arrow_size</td><td>Returns arrow size (only for 2D plots).</td></tr><tr><td>-font_att</td><td>Returns font attribute of text box.</td></tr><tr><td>-font_color</td><td>Returns color of text font.</td></tr><tr><td>-font_factor</td><td>Returns multiplier for text font (only for 2D plots).</td></tr><tr><td>-font_family</td><td>Returns font family of text.</td></tr><tr><td>-font_size</td><td>Returns font size (only for xy plots).</td></tr><tr><td>-line_color</td><td>Returns line and arrow color (only for 2D plots).</td></tr><tr><td>-line_style</td><td>Returns the representation style of the text box line (only for 2D plots).</td></tr><tr><td>-line_width</td><td>Returns width of text box and anchor line (only for 2D plots).</td></tr><tr><td>-pos</td><td>Returns the lower-left corner position of the text box. For xy plots, it returns a point in the world coordinate system {x, y} (see Inserting Text on page 59 for a description of the world coordinate system). For 2D plots, it returns a relative normalized screen coordinates pair (from 0.0 to 1.0).</td></tr><tr><td>-rotation</td><td>Returns the rotation of the text box in degrees (only for xy plots).</td></tr><tr><td>-showanchor</td><td>Returns true if the text box anchor is shown (only for 2D plots).</td></tr><tr><td>-show_border</td><td>Returns true if the text box border is shown (only for 2D plots).</td></tr><tr><td>-text</td><td>Returns text in text box.</td></tr><tr><td>-plot&lt;stringValue&gt;</td><td>Name of the plot where the command will search for the text box. If not specified, the command uses the selected plot.</td></tr></table>

# Returns

The value of the queried property.

# Example

get_textbox_prop Textbox_1 -text #-> Hello World

# get_variable_data

Returns a list of variable values.

Note:

This command applies to xy plots only.

Syntax

```xml
get_variable_data <stringValue> -dataset <stringValue> 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringValue&gt;</td><td>Name of the variable.</td></tr><tr><td>-dataset</td><td>Name of the dataset.</td></tr></table>

# Returns

List.

# Example

get_variable_data X -dataset plotXY

#-> 1 2 3 4 5

# get_vector_prop

Returns the specified property of a vector field.

# Note:

This command applies to 2D and 3D plots only.

# Syntax

```ocaml
get_vector_prop <stringValue>   
( -constant_heads | -fill_color | -head_angle | -head_shape | -head_size | -line_color | -line_pattern | -line_width | -scale | -scale_factor_grid | -scale_factor_uniform | -show ) [-geom <stringValue>] [-plot <stringValue>]
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringValue&gt;</td><td>Name of the vector field.</td></tr><tr><td>-constant_heads</td><td>Shows whether the arrows are constant to the plot area regardless of the vector magnitude or proportional (normal) to the vector magnitude.</td></tr><tr><td>-fill_color</td><td>Color of a solid arrowhead.</td></tr><tr><td>-head_angle</td><td>Arrowhead angle.</td></tr><tr><td>-head_shape</td><td>Shape of the arrows.</td></tr><tr><td>-head_size</td><td>Size of the arrows.</td></tr><tr><td>-line_color</td><td>Color of the arrows.</td></tr><tr><td>-line_pattern</td><td>Line pattern of the arrows.</td></tr><tr><td>-line_width</td><td>Width of the arrows.</td></tr><tr><td>-scale</td><td>Scale for displaying the arrows, either uniform size or a grid display.</td></tr><tr><td>-scale_factor_grid</td><td>Grid factor for displaying the arrows.</td></tr><tr><td>-scale_factor_uniform</td><td>Uniform factor for displaying the arrows.</td></tr><tr><td>-show</td><td>Shows whether arrows are visible.</td></tr><tr><td>-geom&lt;stringValue&gt;</td><td>Specifies the geometry where the command will search for the vector.</td></tr><tr><td>-plot &lt;stringValue&gt;</td><td>Name of the plot where the command will search for the geometry. If not specified, the command uses the selected plot.</td></tr></table>

# Returns

The value of the queried property.

# Example

get_vector_prop ElectricField-V -plot Plot_2D -geom 2D -scale #-> uniform

# get_vertical_lines_prop

Returns the properties of vertical lines.

# Note:

This command applies to xy plots only.

# Syntax

```txt
get_vertical Lines_prop<stringValue> ( -line_color | -line_style | -line_width | -show | -values ) [-plot<stringValue>] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringValue&gt;</td><td>Name of a vertical line.</td></tr><tr><td>-line_color</td><td>Returns the color of the vertical line.</td></tr><tr><td>-line_style</td><td>Returns the style of the vertical line.</td></tr><tr><td>-line_width</td><td>Returns the width of the vertical line in pixels.</td></tr><tr><td>-show</td><td>Indicates whether the vertical line is visible.</td></tr><tr><td>-values</td><td>Returns a list of double values representing the x-values of the vertical line.</td></tr><tr><td>-plot&lt;stringValue&gt;</td><td>Name of the plot where the command searches for the vertical line. If not specified, the command uses the selected plot.</td></tr></table>

# Returns

The value of the queried property.

# Example

get_vertical Lines_prop VerticalLine_1 -values $->$ 0.001 0.0156

# help

Displays information about Sentaurus Visual Tcl commands.

Without any arguments, the command returns a complete list of the available Tcl commands.

# Syntax

help [<stringValue>]

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringValue&gt;</td><td>Sentaurus Visual Tcl command.</td></tr></table>

# Returns

String.

# Example

help import_settings #-> import_settings <stringValue>

# import_settings

Imports Sentaurus Visual settings from a previously saved configuration file.

# Syntax

import_settings <stringValue>

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringValue&gt;</td><td>Name of the configuration file.</td></tr></table>

# Returns

Integer.

# Example

import_settings /path/to/settings.conf

#-> 0

# integrate_field

Integrates a field over a complete 2D or 3D plot, or in specific regions.

# Note:

The command applies to 2D and 3D plots only.

# Syntax

```txt
integrate_field  
[-bottom <doubleValue>] [-top <doubleValue>]  
[-dataset <stringValue> | -plot <stringValue>]  
[-field <stringValue>]  
[-geom <stringValue>]  
[-materials <stringList> | -regions <stringList>]  
[-points <pointList>] [-returndomain]  
[-type x | y | z]  
[-window {<xmin> <ymin> [<zmin> ] <xmax> [<zmax>]} 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>(bottom &lt;doubleValue&gt;</td><td>Sets the lower bound of the polyhedron domain in the extrusion axis.</td></tr><tr><td>-top &lt;doubleValue&gt;</td><td>Sets the upper bound of the polyhedron domain in the extrusion axis.</td></tr><tr><td>-dataset &lt;stringValue&gt; | -plot &lt;stringValue&gt;</td><td>Name of the plot or dataset. If not specified, uses the selected plot.</td></tr><tr><td>-field &lt;stringValue&gt;</td><td>Specifies the field to integrate. If not specified, uses the current active field.</td></tr><tr><td>-geom &lt;stringValue&gt;</td><td>Specifies the name of the dataset.</td></tr><tr><td>-materials &lt;stringList&gt; | -regions &lt;stringList&gt;</td><td>List of regions or materials to integrate. If not specified, integrates all regions.</td></tr><tr><td>-points &lt;pointList&gt;</td><td>Sets the vertices for the polyline to be extruded along the chosen axis to create a polyhedron domain. Points must be defined as: { {x0 y0 z0} {x1 y1 z1} ...}</td></tr><tr><td>-returndomain</td><td>Sets the function to return the integrated domain value (an integrated volume when used in three dimensions, or an integrated surface when used in two dimensions).</td></tr><tr><td>-type x | y | z</td><td>Selects the extrusion axis for the polyline defined by the points.</td></tr><tr><td>-window {&lt;xmin&gt; &lt;ymin&gt; [&lt;zmin&gt;] 
&lt;xmax&gt; &lt;ymax&gt; [&lt;zmax&gt;]}</td><td>Defines a specific window to integrate. 
Note: 
When the plot to be integrated is a 2D plot with x- and z-axes, the parameters change to {&lt;xmin&gt; &lt;zmin&gt; 
&lt;xmax&gt; &lt;zmax&gt;} . In the same way, when the plot has y- and z-axes, the parameters change to {&lt;ymin&gt; &lt;zmin&gt; 
&lt;ymax&gt; &lt;zmax&gt;} .</td></tr></table>

# Returns

Double.

# Example

integrate_field -field Abs(ElectricField) -regions {RGate}

# Dataset: 3D

# Field: Abs(ElectricField)

# $= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =$

# Regions of Dimension 3

#

# 1. RGate (PolySi)

# Integral: 3.697957e-04 [V*um^2]

# Domain: 9.211180e-04 [um^3]

#

# Total Integral: 3.697957e-04 [V*um^2]

# Total Domain: 9.211180e-04 [um^3]

# ==================================

#-> 0.000369796

# link_plots

Links plot properties of two or more plots.

# Syntax

```tcl
linkplots<stringList> [-id<intValue>] [-special{axes_prop axis_x axis_y axis_y2 blanking curve_prop cuts deformation field_prop field_sel grid_prop legend_prop matreg move plot_mode plot_prop streamlines}] [-unlink] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringList&gt;</td><td>List of all the plots to be linked.</td></tr><tr><td>-id &lt;intValue&gt;</td><td>Integer identifier for the linked plots.</td></tr><tr><td>-special {&lt;properties&gt;}</td><td>Links only the specified properties:</td></tr><tr><td>axes_prop</td><td>Links axes properties (only for 2D plots).</td></tr><tr><td>axis_x, axis_y, axis_y2</td><td>Links properties of the x-, y-, and y2-axis, respectively (only for xy plots).</td></tr><tr><td>blanking</td><td>Links blanking operations (only for 2D and 3D plots).</td></tr><tr><td>curve_prop</td><td>Links curve properties (only for xy plots).</td></tr><tr><td>cuts</td><td>Links cuts such as cutlines and cutplanes (only for 2D and 3D plots).</td></tr><tr><td>deformation</td><td>Links deformation operations (only for 2D and 3D plots).</td></tr><tr><td>field_prop</td><td>Links the properties of fields such as the range, scale, and number of levels (only for 2D and 3D plots).</td></tr><tr><td>field_sel</td><td>Links the selection of fields (on and off for contour band and line fields) (only for 2D and 3D plots).</td></tr><tr><td>grid_prop</td><td>Links grid properties (only for xy plots).</td></tr><tr><td>legend_prop</td><td>Links legend properties.</td></tr><tr><td>matreg</td><td>Links material and region properties.</td></tr><tr><td>move</td><td>Links movements such as zoom, pan, and rotation (only for 3D plots).</td></tr><tr><td>plot_mode</td><td>Links the plot mode, such as select, zoom window, and probe.</td></tr><tr><td>plot_prop</td><td>Links plot properties, except the text of the plot title.</td></tr><tr><td>streamlines</td><td>Links operations on streamlines. Deactivated by default (only for 2D and 3D plots).</td></tr><tr><td>-unlink</td><td>Removes linking.</td></tr></table>

# Returns

Integer.

# Example

link_plots {Plot_1 Plot_2} -id 10 #-> 10

# list_curves

Returns a list of curve names.

Note:

The command applies to xy plots only.

# Syntax

```txt
list.curves [<stringValue>] [-plot <stringValue>] [-selected | -not_selected] [-show | -hide] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringValue&gt;</td><td>Specifies the search pattern to use.</td></tr><tr><td>-plot</td><td>Searches on a specific plot. If not specified, the command searches on the selected plot.</td></tr><tr><td>-selected | -not_selected</td><td>Returns a list of curves that are selected or are not selected.</td></tr><tr><td>-show | -hide</td><td>Shows or hides the results.</td></tr></table>

# Returns

List.

# Example

```txt
list.curves_1
#-> Curve_1 Curve_12 
```

# list_custom_buttons

Returns a list of custom buttons.

# Syntax

list_custom_buttons [<stringValue>]

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringValue&gt;</td><td>Specifies the search pattern to use. If not specified, the command lists all custom buttons.</td></tr></table>

# Returns

List of all custom buttons and separators that match the pattern. If no search pattern is specified, the command returns all custom buttons.

# Example

list_custom_buttons Buttons

#-> Buttons1 Custom_Button2 MyButton

# list_cutlines

Returns a list of cutlines. If no arguments are specified, the command returns all cutlines.

# Note:

The command applies to 2D plots only.

# Syntax

```txt
listcutlines [<stringValue>] [-plot <stringValue>] [-type x | y | z | free] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringValue&gt;</td><td>Specifies the search pattern to use.</td></tr><tr><td>-plot</td><td>Searches on a specific plot. If not specified, the command searches on the selected plot.</td></tr><tr><td>-type x | y | z | free</td><td>Specifies the type of outline to search for.</td></tr></table>

# Returns

List.

# Example

```txt
listcutlines -type y #-> C1 C2 
```

# list_cutplanes

Returns a list of cutplanes. If no arguments are specified, the command returns all cutplanes.

# Note:

The command applies to 3D plots only.

# Syntax

```txt
list-cutplanes [<stringValue>] [-plot <stringValue>] [-type x | y | z | free] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringValue&gt;</td><td>Specifies the search pattern to use.</td></tr><tr><td>-plot&lt;stringValue&gt;</td><td>Searches on a specific plot. If not specified, the command searches on the selected plot.</td></tr><tr><td>-type x | y | z | free</td><td>Specifies the type of cutplane to search for.</td></tr></table>

# Returns

List.

# Example

```txt
listcutplanes -type y #-> C3 
```

# list_datasets

Returns a list of dataset names according to the given pattern. If no pattern is specified, then all datasets are returned. You can filter the returned datasets by dimension, a given plot, or the selected plot. The dimension filter can be combined with the given plot or selected plot filter.

# Syntax

```txt
list_datasets [<stringValue>] [-dim <intValue>] [-plot <stringValue | -selected] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringValue&gt;</td><td>Specifies the search pattern to use.</td></tr><tr><td>-dim</td><td>Dimension of datasets, which can be 1, 2, or 3.</td></tr><tr><td>-plot</td><td>Specifies whether to filter by plot name or by the selected plot. If you specify one of these arguments, then the list of returned datasets is restricted to those contained in the named plot, for the -plot argument, or those contained in the selected plot, for the -selected argument.</td></tr></table>

# Returns

List.

# Example

```gitattributes
list_databases -dim 3
#-> 3D_3 
```

# list_ellipses

Returns a list of names of ellipses.

Note:

This command applies to xy plots only.

# Syntax

list_ellipses [<stringValue>] [-plot <stringValue>]

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringValue&gt;</td><td>Specifies the search pattern to use. If no search pattern is specified, the names of all ellipses are returned.</td></tr><tr><td>-plot &lt;stringValue&gt;</td><td>Name of a plot to search. If not specified, the command uses the selected plot.</td></tr></table>

# Returns

List of names of ellipses matching the search pattern.

# Example

list_ellipses -plot Plot_1

#-> Ellipse_1 Ellipse_2

# list_fields

Returns a list of field names.

# Note:

This command applies to 2D and 3D plots only.

# Syntax

```txt
list_fields [<stringValue>] [-dataset <stringValue> | -geom <stringValue> | -plot <stringValue>] [-show | -hide] [-show_bands | -hide_bands] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringValue&gt;</td><td>Specifies the search pattern to use.</td></tr><tr><td>-dataset</td><td>Searches a specific plot, dataset, or geometry.</td></tr><tr><td>-geom</td><td></td></tr><tr><td>-plot</td><td></td></tr><tr><td>-show | -hide</td><td>Shows or hides contour bands.</td></tr><tr><td>-show_bands | -hide_bands</td><td>Searches fields with contour bands shown or hidden.</td></tr></table>

# Returns

List.

# Example

```txt
list_fields ElectricField -plot Plot_3D  
---> Abs(ElectricField) ElectricField-X ElectricField-Y ElectricField-Z 
```

# list_files

Returns a list of opened files according to the given pattern. If no pattern is specified, all files are returned. You can filter the returned files by only those contained in the selected plot.

# Syntax

list_files [<stringValue>] [-fullpath] [-selected]

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringValue&gt;</td><td>Specifies the search pattern to use.</td></tr><tr><td>-fullpath</td><td>Specifies the full path to where the directory resides that contains the opened files. If not specified, uses the current work directory.</td></tr><tr><td>-selected</td><td>Specifies to retrieve only the files contained in the selected plot.</td></tr></table>

# Returns

List.

# Example

list_files

#-> 2D_file.tdr 3D_file.tdr

# list_lines

Returns a list of line names.

Note:

This command applies to xy and 2D plots only.

Syntax

list_lines [<stringValue>] [-plot <stringValue>]

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringValue&gt;</td><td>Specifies the search pattern to use. If no search pattern is specified, the names of all lines are returned.</td></tr><tr><td>-plot&lt;stringValue&gt;</td><td>Name of the plot. If not specified, the command uses the selected plot.</td></tr></table>

# Returns

List of names of lines matching the search pattern.

Example

list_lines -plot Plot_1#-> Line_1 Line_2

# list_materials

Returns a list of material names.

# Note:

The command applies to 2D and 3D plots only.

# Syntax

```txt
list_materials [<stringValue>]  
[-dataset <stringValue> | -geom <stringValue> | -plot <stringValue>]  
[-show_all | -hide_all] [-show_border | -hide_border]  
[-show_bulk | -hide_bulk] [-show_field | -hide_field]  
[-showmesh | -hide meshes] 
```

```txt
Argument Description  
<stringValue> Specifies the search pattern to use.  
-dataset <stringValue> | Searches a specific plot, dataset, or geometry.  
-geom <stringValue> |  
-plot <stringValue>  
-show_all | -hide_all Shows or hides materials completely.  
-show_border | -hide_border Shows or hides borders of materials.  
-show_bulk | -hide_bulk Shows or hides bulk of materials.  
-show_field | -hide_field Shows or hides fields of materials.  
-show meshes | -hide meshes Shows or hides mesh of materials. 
```

# Returns

List.

# Example

```txt
list_materials -plot Plot_3D
-> Contact DepletionRegion JunctionLine nitride Oxide PolySi Silicon 
```

# list_movie_frames

Returns the list of frames in the frame buffer.

# Syntax

list_movie_frames

# Returns

List.

# Example

list_movie_frames # Frame0001 Frame0002 Frame0003 Frame0004

# list_plots

Returns a list of plot names according to the given pattern. If no pattern is specified, all plots are returned.

# Syntax

list_plots [<stringValue>] [-dim <intValue>] [-link <intValue>] [-selected] [-show | -hide]

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringValue&gt;</td><td>Specifies the search pattern to use.</td></tr><tr><td>-dim</td><td>Dimension of plots, which can be 1, 2, or 3.</td></tr><tr><td>-link</td><td>Returns only linked plots with the ID link equal to &lt;intValue&gt;.</td></tr><tr><td>-selected</td><td>Returns the selected plot.</td></tr><tr><td>-show | -hide</td><td>Specifies whether only visible plots (-show) or only hidden plots (-hide) will be listed.</td></tr></table>

# Returns

List.

# Example

list_plots -dim 3 #-> 3D

# list_rectangles

Returns a list of rectangle names.

Note:

This command applies to xy and 2D plots only.

# Syntax

list_rectangles [<stringValue>] [-plot <stringValue>]

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringValue&gt;</td><td>Specifies the search pattern to use. If no search pattern is specified, the names of all rectangles are returned.</td></tr><tr><td>-plot&lt;stringValue&gt;</td><td>Name of the plot. If not specified, the command uses the selected plot.</td></tr></table>

# Returns

List of names of rectangles matching the search pattern.

# Example

list_rectangles -plot Plot_1 #-> Rectangle_1 Rectangle_2 Rectangle_3

# list_regions

Returns a list of region names.

# Note:

The command applies to 2D and 3D plots only.

# Syntax

```txt
list_regions [<stringValue>]  
[-dataset <stringValue> | -geom <stringValue> | -plot <stringValue>]  
[-material <stringValue>] [-parts]  
[-show_all | -hide_all] [-show_border | -hide_border]  
[-show_bulk | -hide_bulk] [-show_field | -hide_field]  
[-showmesh | -hide meshes] 
```

```txt
Argument Description  
<StringValue> Specifies the search pattern to use.  
-dataset <stringValue> | Returns the regions of the specified plot, dataset, or geometry.  
-geom <stringValue> | If not specified, the command returns the regions of the selected plot.  
-plot <stringValue>  
-material <stringValue> Returns the regions present in the specified material.  
-parts Returns a list of regions that have parts.  
-show_all | -hide_all Filters by whether regions are completely shown or hidden.  
-show_border | -hide_border Filters by whether materials have their border shown or hidden.  
-show_bulk | -hide_bulk Filters by whether materials have their bulk shown or hidden.  
-show_field | -hide_field Filters by whether materials have their field shown or hidden.  
-show meshes | -hide meshes Filters by whether materials have their mesh shown or hidden. 
```

# Returns

List.

# Example

```txt
list_regions -dataset 3D
#-> bulk gate drain DepletionRegion JunctionLine source 
```

# list_streamlines

Returns a list of streamlines created on the plot.

Note:

The command applies to 2D and 3D plots only.

# Syntax

list_streamlines [<stringValue>] [-plot <stringValue>]

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringValue&gt;</td><td>Specifies the search pattern to use.</td></tr><tr><td>-plot&lt;stringValue&gt;</td><td>Returns the streamlines of the specified plot. If not specified, the command returns the streamlines of the selected plot.</td></tr></table>

# Returns

List.

# Example

list_streamlines #-> Streamline_1 Streamline_2 Streamline_3

# list_tdr_states

Returns a list of state names for the geometry visualized in a plot.

# Syntax

list_tdr_states [<stringValue>] [-plot <stringValue>]

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringValue&gt;</td><td>Specifies the search pattern that the state name must match. If not specified, all state names are returned.</td></tr><tr><td>-plot&lt;stringValue&gt;</td><td>Specifies the name of the plot where the geometry of interest is visualized. If not specified, the command uses the selected plot.</td></tr></table>

# Returns

List.

# Example

list_tdr_states state_1* -plot Plot_2D

#-> state_1 state_10 state_100

# list_textboxes

Returns a list of text box names.

Note:

This command applies to xy and 2D plots only.

# Syntax

list_textboxes [<stringValue>] [-plot <stringValue>]

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringValue&gt;</td><td>Specifies the search pattern to use. If no search pattern is specified, the names of all text boxes are returned.</td></tr><tr><td>-plot&lt;stringValue&gt;</td><td>Name of the plot. If not specified, the command uses the selected plot.</td></tr></table>

# Returns

List of names of text boxes matching the search pattern.

# Example

list_textboxes -plot Plot_1 #-> TextBox_1 TextBox_2 TextBox_3

# list_variables

Returns a list of variable names according to the given pattern. If no pattern is specified, all variables are returned.

# Note:

The command applies to xy plots only.

# Syntax

list_variables -dataset <stringValue> [<stringValue>]

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-dataset</td><td>Specifies the dataset to use.</td></tr><tr><td>&lt;stringValue&gt;</td><td>Specifies the search pattern to use.</td></tr></table>

# Returns

List.

# Example

list_variables -dataset testDataset #-> drainCurrent gateToSourceVoltage time

# list_vertical_lines

Returns a list of the names of vertical lines.

Note:

This command applies to xy plots only.

# Syntax

list_vertical_lines [<stringValue>] [-plot <stringValue>]

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringValue&gt;</td><td>Specifies the search pattern to use. If no search pattern is specified, the names of all vertical lines are returned.</td></tr><tr><td>-plot&lt;stringValue&gt;</td><td>Name of the plot. If not specified, the command uses the selected plot.</td></tr></table>

# Returns

List of names of vertical lines matching the search pattern.

# Example

list_vertical_lines -plot Plot_1 #-> DE(C1(n_10)) DE(C2(n_10))

# load_file

Loads the specified file, and returns a string with the dataset name associated with the file.

# Syntax

```txt
load_file<stringValue> [-alldata] [-fod] [-geoms<intList>] [-name<stringValue>] [-parts] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringValue&gt;</td><td>Name of the file to load.</td></tr><tr><td>-alldata</td><td>Loads all data from the file regardless of the user preference settings.</td></tr><tr><td>-fod</td><td>Loads field data on demand.</td></tr><tr><td>-geoms &lt;intList&gt;</td><td>Specifies the geometry indices to load.</td></tr><tr><td>-name &lt;stringValue&gt;</td><td>Specifies a custom dataset name. See Object Names: -name Argument on page 213.</td></tr><tr><td>-parts</td><td>This option specifies that, if regions have parts, the parts are displayed and controlled independently.</td></tr></table>

# Returns

String.

# Example

load_file /pathTo/Structure.tdr -geoms {0 2}

#-> Structure_geometry_0

# load_file_datasets

Loads datasets from the specified file.

# Syntax

```perl
load_file_datasets <stringValue> [-alldata] [-geoms <intList>] [-parts] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringValue&gt;</td><td>Name of the file.</td></tr><tr><td>-alldata</td><td>Loads all data from the file regardless of the user preference settings.</td></tr><tr><td>-geoms &lt;intList&gt;</td><td>Specifies the geometry indices to load.</td></tr><tr><td>-parts</td><td>This option specifies that, if regions have parts, the parts are displayed and controlled independently.</td></tr></table>

# Returns

List.

# Example

```txt
load_file_datasets /pathTo/IdVg.tdr
##-> IdVg
```

# load_library

Loads a Sentaurus Visual library. It can load either all libraries located at the default paths, or only libraries located at the given path, or only the library given by the specified path and the library name.

# Syntax

```txt
load_library
- all |
-path <stringValue> [<stringValue>] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-all</td><td>Loads all libraries located at the default path.</td></tr><tr><td>-path &lt;stringValue&gt;[&lt;stringValue&gt;]</td><td>Path to where libraries for loading are located.
Optionally, you can specify the name of a particular library located at the specified path.</td></tr></table>

# Returns

Integer.

# Example

loadLibrary -path $\sim$ /mySVLibs myLibrary1  
#-> 0

# load_script_file

Loads a Tcl script or Inspect script.

# Syntax

```txt
load.script_file <stringValue> [-inspect] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringValue&gt;</td><td>Name of the Tcl script to load.</td></tr><tr><td>-inspect</td><td>Forces Sentaurus Visual to execute the script as an Inspect script.</td></tr></table>

# Returns

Integer.

# Example

```txt
load.script_file testScript.tcl
##-> 0 
```

# move_plot

Moves the selected plot.

# Syntax

```txt
move_plot -position <doubleList> [-absolute] [-plot <stringValue>] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-position &lt;doubleList&gt;</td><td>Sets the new position of the plot. Arguments of type Double are expected.</td></tr><tr><td>-absolute</td><td>Moves plot to an absolute position if specified.</td></tr><tr><td>-plot &lt;stringValue&gt;</td><td>Name of the plot to be moved. If not specified, the current active plot is used.</td></tr></table>

# Returns

Integer.

# Example

```txt
move_plot -position {1.5 0.5} -absolute
	#-> 0 
```

# overlay_plots

Overlays two or more plots. Creates a new plot with the specified name.

# Note:

The command applies to 2D and 3D plots only.

# Syntax

```txt
overlay_plots <stringList>  
[-datasets <stringList>] [-name <stringValue>] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringList&gt;</td><td>List of plots to be overlaid onto the first plot. If only one plot is given, the command overlays the plot onto the list of datasets.</td></tr><tr><td>-datasets &lt;stringList&gt;</td><td>Overlays this list of datasets to the list of plots specified.</td></tr><tr><td>-name &lt;stringValue&gt;</td><td>Name of the new plot to be created. If not specified, creates a new plot with a generic name. See Object Names: -name Argument on page 213.</td></tr></table>

# Returns

String.

# Example

```tcl
overlay_plots {Plot_3D Plot_3D_2} -name Plot_Overlay
##-> Plot_Overlay 
```

# probe_curve

Probes a curve using the interpolation that matches the axis (linear if the axis is in normal mode or log if the axis is in log mode).

# Note:

The command applies to xy plots only. For 2D and 3D plots, use the command probe_field (see probe_field on page 325).

# Syntax

```txt
probe_curve <stringValue> -valueX <doubleValue> | -valueY <doubleValue> | -valueY2 <doubleValue> [-extrapolate | -snap] [-plot <stringValue>] [-position | -scalar] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringValue&gt;</td><td>Identifier associated with the curve to be probed.</td></tr><tr><td>-valueX | -valueY | -valueY2</td><td>Specifies the point to probe on the curve.</td></tr><tr><td>-extrapolate | -snap</td><td>Specifies either that the probe can extrapolate values or that the probe returns the curve closest point.</td></tr><tr><td>-plot</td><td>Name of the plot with the curve to be probed. If not specified, the command uses the selected plot.</td></tr><tr><td>-position | -scalar</td><td>Returns either the position of the curve or the scalar value of the curve.</td></tr></table>

# Returns

Double.

# Example

probe_curve idvg_1_des -valueX 0.85

#-> 0.5433e-6

# probe_field

Probes a point on a plot, and returns the values of the defined field on that point.

# Note:

This command applies to 2D and 3D plots only. For xy plots, use the command probe_curve.

# Syntax

```txt
probe_field
- coordinate {<x> <y> [<z>]} |
- point <intValue> -region <stringValue>
[-field <stringValue>] [-geom <stringValue] | -plot <stringValue>
[-position] [-snap] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-coord {&lt;x&gt; &lt;y&gt; [z]}</td><td>Specifies the point to be probed. In 2D plots, the z value must be 0 or must be left undefined.</td></tr><tr><td>-point &lt;intValue&gt;</td><td>Specifies the vertex ID relative to the region set to be probed. Use with the -region option.</td></tr><tr><td>-region &lt;stringValue&gt;</td><td>Specifies the region where the field will be probed. Use with the -point option.</td></tr><tr><td>-field &lt;stringValue&gt;</td><td>Name of the field to probe in the plot. If not specified, probes the active field.</td></tr><tr><td>-geom &lt;stringValue&gt; | -plot &lt;stringValue&gt;</td><td>Name of the plot or geometry to be probed. If not specified, the command probes the selected plot.</td></tr><tr><td>-position</td><td>Returns a vector with the coordinates of the probe. If -snap is specified, returns the coordinates of the closest node. If -snap is not specified, returns -coord.</td></tr><tr><td>-snap</td><td>Probes the field at the closest node if specified.</td></tr></table>

# Returns

Double.

# Example

```tcl
probe_field -field DopingConcentration -coord {0.2 0.3 -0.2}  
#-> -2e18 
```

# reload_datasets

Reloads all the specified datasets.

# Syntax

```txt
reloadDatasets <stringList> [-alldata] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringList&gt;</td><td>List of datasets to reload.</td></tr><tr><td>-alldata</td><td>Reloads all data from the files regardless of the user preference settings.</td></tr></table>

# Returns

Integer.

# Example

```txt
reloadDatasets{3D 3D_2} #->0 
```

# reload_files

Reloads the specified files.

# Syntax

```txt
reload_files <stringList> [-alldata] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringList&gt;</td><td>List of files to reload.</td></tr><tr><td>-alldata</td><td>Reloads all data from the files regardless of the user preference settings.</td></tr></table>

# Returns

Integer.

# Example

```txt
reload_files{2D.tdr3D.tdr} #->0 
```

# remove_curves

Removes curves from an xy plot.

# Syntax

```txt
remove_curves <stringList> [-plot <stringValue>] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringList&gt;</td><td>List of curve names.</td></tr><tr><td>-plot&lt;stringValue&gt;</td><td>Name of the plot from where curves will be removed. If not specified, the command uses the active plot.</td></tr></table>

# Returns

Integer.

# Example

```txt
remove_curves {IdVg_1 IdVg_2}  
#-> 0 
```

# remove_custom_buttons

Removes custom buttons.

# Syntax

```xml
removeCustombuttons <stringList> 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringList&gt;</td><td>List of names of custom buttons.</td></tr></table>

# Returns

List of all custom buttons and separators removed.

# Example

```txt
removeCustom Buttons {Buttons1 MyButton}  
#-> Buttons1 MyButton 
```

# remove_cutlines

Removes the specified cutlines.

# Syntax

remove_cutlines <stringList> [-plot <stringValue>]

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringList&gt;</td><td>List of outline names.</td></tr><tr><td>-plot&lt;stringValue&gt;</td><td>Name of plot from where the outlines will be removed. If not specified, the command uses the active plot.</td></tr></table>

# Returns

List.

# Example

remove_cutlines {C1 C2} #-> C1 C2

# remove_cutplanes

Removes the specified cutplanes.

# Syntax

remove_cutplanes <stringList> [-plot <stringValue>]

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringList&gt;</td><td>List of cutplane names.</td></tr><tr><td>-plot&lt;stringValue&gt;</td><td>Name of plot from where the cutplanes will be removed.</td></tr></table>

# Returns

List.

# Example

remove_cutplanes {C1 C2} #-> C1 C2

# remove_datasets

Removes the specified datasets.

# Syntax

remove_datasets <stringList>

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringList&gt;</td><td>List of dataset names.</td></tr></table>

# Returns

Integer.

# Example

remove_datasets {dataSet1 dataSet2 dataSet3} #-> 0

# remove_ellipses

Removes ellipses from a plot.

# Note:

This command applies to xy plots only.

# Syntax

remove_ellipses <stringList> [-plot <stringValue>]

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringList&gt;</td><td>List of ellipse names.</td></tr><tr><td>-plot &lt;stringValue&gt;</td><td>Name of the plot. If not specified, the command uses the selected plot.</td></tr></table>

# Returns

List of deleted ellipses.

# Example

```rust
remove_ellipses{Ellipse_1 Ellipse_2} -plot Plot_1  
##-> Ellipse_1 Ellipse_2 
```

# remove_lines

Removes lines from a plot.

Note:

This command applies to xy and 2D plots only.

# Syntax

```txt
removelines<stringList>[-plot<stringValue>] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringList&gt;</td><td>List of line names.</td></tr><tr><td>-plot&lt;stringValue&gt;</td><td>Name of the plot. If not specified, the command uses the selected plot.</td></tr></table>

# Returns

List of deleted lines.

# Example

```txt
removelinesLine_1 -plotPlot_n60_des
##-> Line_1 
```

# remove_plots

Removes the specified plots.

# Syntax

```xml
remove_plots <stringList> 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringList&gt;</td><td>List of plot names.</td></tr></table>

# Returns

Integer.

# Example

remove_plots {plotXY plot2D plot3D} $\# -- 0$

# remove_rectangles

Removes rectangles from a plot.

# Note:

This command applies to xy and 2D plots only.

# Syntax

```txt
remove_rectangles <stringList> [-plot <stringValue>] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringList&gt;</td><td>List of rectangle names.</td></tr><tr><td>-plot &lt;stringValue&gt;</td><td>Name of the plot. If not specified, the command uses the selected plot.</td></tr></table>

# Returns

List of deleted rectangles.

# Example

remove_rectangles {Rectangle_1 Rectangle_2} -plot Plot_n60_des #-> Rectangle_1 Rectangle_2

# remove_rulers

Removes the specified rulers from a plot.

# Syntax

remove_rulers <intList> [-plot <stringValue>]

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;intList&gt;</td><td>List of ruler IDs.</td></tr><tr><td>-plot &lt;stringValue&gt;</td><td>Name of the plot from where the rulers will be removed. If not specified, the command uses the selected plot.</td></tr></table>

# Returns

Integer.

# Example

remove_rulers {1 2 3} #-> 0

# remove_streamlines

Removes the specified streamlines.

# Syntax

remove_streamlines <stringList> [-plot <stringValue>]

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringList&gt;</td><td>List of streamline names.</td></tr><tr><td>-plot</td><td>Name of the plot from where the streamlines will be removed. If not specified, the command uses the selected plot.</td></tr></table>

# Returns

List.

# Example

remove_streamlines {Streamline_1 Streamline_2}

#-> Streamline_1 Streamline_2

# remove_textboxes

Removes text boxes from a plot.

Note:

This command applies to xy and 2D plots only.

Syntax

```txt
remove_textboxes <stringList> [-plot <stringValue>] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringList&gt;</td><td>List of names of text boxes.</td></tr><tr><td>-plot&lt;stringValue&gt;</td><td>Name of the plot. If not specified, the command uses the selected plot.</td></tr></table>

# Returns

List of deleted text boxes.

# Example

```txt
remove_textboxes {TextBox_1 TextBox_2 TextBox_3} -plot Plot_1  
##-> TextBox_1 TextBox_2 TextBox_3 
```

# render_mode

Updates the rendering status when plots are loaded. If rendering is switched off, you must switch it on when plots are finished loading; otherwise, no plots are displayed.

# Note:

This command applies to 2D and 3D plots only.

# Syntax

```txt
render_mode [-on | -off] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-on | -off</td><td>Switches on or off rendering when plots are loaded. If no option is specified, the command displays the current status of rendering</td></tr></table>

# Returns

Current status of rendering mode.

# Example

```txt
render_mode -on 
```

```txt
on 
```

# reset_settings

Reset Sentaurus Visual settings to their default values.

# Syntax

```ignorefile
reset_settings 
```

# Returns

None.

# Example

```ignorefile
reset_settings 
```

# rotate_plot

Rotates a 3D plot by specifying either axes, or angles, or a direction, or a plane. Different axes can be rotated simultaneously. The axis and angles used are explained in Figure 67 on page 121.

# Note:

This command applies to 3D plots only and is supported in batch mode in Sentaurus Visual.

# Syntax

```txt
rotate_plot
- alpha <doubleValue> -psi <doubleValue> -theta <doubleValue>
- angle <doubleValue> -direction (up | down | left | right)
- plane (xy | yz | xz) |
-x <doubleValue> -y <doubleValue> -z <doubleValue>
[-absolute] [-plot <stringValue>] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-alpha</td><td>Rotates the plot using alpha spherical coordinate (in degrees).</td></tr><tr><td>-psi</td><td>Rotates the plot using psi spherical coordinate (in degrees).</td></tr><tr><td>-theta</td><td>Rotates the plot using theta spherical coordinate (in degrees).</td></tr><tr><td>-angle</td><td>Rotates the plot in the specified direction by the angle specified by -angle.</td></tr><tr><td>-direction up | down | left | right</td><td>Rotates the plot by the specified angle (in degrees) in the direction defined by -direction.</td></tr><tr><td>-plane xy | yz | xz</td><td>Rotates the plot in the specified plane.</td></tr><tr><td>-x</td><td>Rotates the plot around the x-axis (in degrees).</td></tr><tr><td>-y</td><td>Rotates the plot around the y-axis (in degrees).</td></tr><tr><td>-z</td><td>Rotates the plot around the z-axis (in degrees).</td></tr><tr><td>-absolute</td><td>Rotates the plot to an absolute position if specified.</td></tr><tr><td>-plot</td><td>Name of the plot. If not specified, the command uses the selected plot.</td></tr></table>

# Returns

Integer.

# Example

```txt
rotate_plot -x 10.5 -y 20  
#-> 0  
rotate_plot -plane xz  
#-> 0  
rotate_plot -direction up -angle 90  
#-> 0 
```

# save_plot_to_script

Exports the plot properties and curve data of the current plot to a Tcl file.

# Note:

This command applies to xy plots only.

# Syntax

```txt
save_plot_to.script <stringValue> [-overwrite] [-plot <stringValue>] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringValue&gt;</td><td>Specifies the path (either absolute or relative) where the resulting Tcl file will be located.</td></tr><tr><td>-overwrite</td><td>Specifies whether the target Tcl file should be overwritten if it already exists.</td></tr><tr><td>-plot</td><td>Name of the plot to be exported. If not specified, the command uses the selected plot.</td></tr></table>

# Returns

Integer.

# Example

```txt
save_plot_to.script testFile.tcl -plot Plot_1 -overwrite
##-> 0 
```

# select_plots

Selects the plots.

# Syntax

```txt
select_plots <stringList> 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringList&gt;</td><td>List of plot names to be selected.Passing an empty list (select_plots {} ) deselects all plots.</td></tr></table>

# Returns

List.

# Example

```txt
select_plots {plot2D anotherPlot2D}  
--> plot2D anotherPlot2D 
```

# set_axis_prop

Sets axis properties.

If -axis is not specified, the properties are set for all axes.

Note:

The command applies to xy and 2D plots only.

# Syntax

```txt
set_axis_prop
[-anchor <doubleValue>]  
[-auto(padding | -manual(padding]  
[-auto_precision | -manual_precision]  
[-auto_spacing | -manual_spacing]  
[-axis x | y | z | y2]  
[-inverted | -not_inverted]  
[-label_angle <doubleValue>]  
[-label_font_att normal | bold | italic | underline | strikeout]  
[-label_font_color <#rrggbb>]  
[-label_font_factor <doubleValue>]  
[-label_font_family arial | courier | times]  
[-label.Font_size <intValue>]  
[-label_format preferred | scientific | engineering | fixed]  
[-label-padding <intValue>] [-label_precision <intValue>]  
[-major ticks_length <intValue>]  
[-major ticks_width <intValue>]  
[-max <doubleValue>] [-maxauto | -max_fixed]  
[-min <doubleValue>] [-min auto | -min_fixed]  
[-minor ticks_length <intValue>]  
[-minor ticks_position center | in | out]  
[-minor ticks_width <intValue>]  
[-nof minor ticks <intValue>]  
[-padding <intValue>]  
[-plot <stringValue>]  
[-range {<x1> <x2}] [-reset]  
[-show | -hide] [-showminorTicks | -hideminorTicks]  
[-show_label | -hide_label] [-showTicks | -hideTicks]  
[-show_title | -hide_title] [-spacing <doubleValue>]  
[-ticks_position out | in | center] [-title <stringValue>]  
[-title.Font_att normal | bold | italic | underline | strikeout]  
[-title.Font_color <#rrggbb>]  
[-title.Font_factor <doubleValue>]  
[-title.Font_family arial | courier | times]  
[-title.Font_size <intValue>]  
[-type linear | log] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-anchor</td><td>Sets the anchor of ticks.</td></tr><tr><td>-auto(padding | manual(padding</td><td>Specifies either automatic padding or manual padding of the axis (applies to xy plots only).</td></tr><tr><td>-autoPRECISION | manual_precISION</td><td>Sets the automatic or manual precision of the axis.</td></tr><tr><td>-auto_spacing | manualspacing</td><td>Sets the spacing mode of ticks.</td></tr><tr><td>-axis x | y | z | y2</td><td>Axis to apply the settings. If not specified, the command applies the attributes to all axes.</td></tr><tr><td>-inverted | -not_inverted</td><td>Inverts the axis values.</td></tr><tr><td>-label_angle</td><td>Sets the rotation angle applied to the labels of major ticks (applies to xy plots only). Only values between -90 and 90, and including -90 and 90, are valid.</td></tr><tr><td>-label_font_att normal | bold | italic | underline | strikeout</td><td>Sets the font attributes of the axis.</td></tr><tr><td>-label_font_color</td><td>Sets the axis color.</td></tr><tr><td>-label.Font_factor</td><td>Sets the size factor of the axis (applies to 2D and 3D plots only).</td></tr><tr><td>-label.Font_family arial | courier | times</td><td>Sets the axis font.</td></tr><tr><td>-label.Font_size</td><td>Sets the font size of the axis (applies to xy plots only).</td></tr><tr><td>-label_format preferred | scientific | engineering | fixed</td><td>Sets the axis numeric format.</td></tr><tr><td>-label(padding</td><td>Sets the padding of the axis values.</td></tr><tr><td>-label_precision</td><td>Sets the numeric precision of the axis.</td></tr><tr><td>-majorTicks_length</td><td>Sets the length of major ticks.</td></tr><tr><td>-majorTicks_width</td><td>Sets the width of major ticks (applies to xy plots only).</td></tr><tr><td>&lt;intValue&gt;</td><td></td></tr><tr><td>-max</td><td>Sets the maximum value of the axis.</td></tr><tr><td>-maxauto | -maxfixed</td><td>Sets the maximum of the axis automatically, or fixes the maximum of the axis to a user-defined value (applies to xy plots only).If -max_fix is specified, any change to the data will not update the range.</td></tr><tr><td>-min</td><td>Sets the minimum value of the axis.</td></tr><tr><td>-minauto | -min固定的</td><td>Sets the minimum of the axis automatically, or fixes the minimum of the axis to a user-defined value (applies to xy plots only).If -min固定的 is specified, any change to the data will not update the range.</td></tr><tr><td>-minorTicks_length</td><td>Sets the length of minor ticks.</td></tr><tr><td>&lt;intValue&gt;</td><td></td></tr><tr><td>-minorTicks_position center | in | out</td><td>Sets the position of minor ticks (applies to 2D plots only).</td></tr><tr><td>-minorTicks_width</td><td>Sets the width of minor ticks (applies to xy plots only).</td></tr><tr><td>-nofminorTicks</td><td>Sets the number of minor ticks.</td></tr><tr><td>-padding</td><td>Sets the padding of the axis in pixels (applies to xy plots only).If -auto(padding is specified, -padding has no effect.</td></tr><tr><td>-plot</td><td>Name of the plot. If not specified, the command applies the attributes to the selected plot.</td></tr><tr><td>-range {{x1} {x2}}</td><td>Sets the axis range.</td></tr><tr><td>-reset</td><td>Reset axis parameters to default values (applies to xy plots only).</td></tr><tr><td>-show | -hide</td><td>Shows or hides the axis.</td></tr><tr><td>-showminorTicks | -hideminorTicks</td><td>Shows or hides the minor ticks (applies to xy plots only).</td></tr><tr><td>-show_label | -hide_label</td><td>Shows or hides the label.</td></tr><tr><td>-show_ticks | -hide_ticks</td><td>Shows or hides the major ticks.</td></tr><tr><td>-show_title | -hide_title</td><td>Shows or hides the axis label.</td></tr><tr><td>-spacing &lt;doubleValue&gt;</td><td>Sets the spacing between ticks.</td></tr><tr><td>-ticks_position out | in | center</td><td>Sets the position of the ticks.</td></tr><tr><td>-title &lt;stringValue&gt;</td><td>Sets the axis label.</td></tr><tr><td>-title.Font_att normal | bold | italic | underline | strikeout</td><td>Sets font attributes of the axis label.</td></tr><tr><td>-title.Font_color &lt;#rrggbb&gt;</td><td>Sets the axis label color.</td></tr><tr><td>-title.Font_factor &lt;doubleValue&gt;</td><td>Sets the font size factor (2D and 3D plots only).</td></tr><tr><td>-title.Font_family arial | courier | times</td><td>Sets the axis label font.</td></tr><tr><td>-title.Font_size &lt;intValue&gt;</td><td>Sets the font size of the axis label font size (xy plots only).</td></tr><tr><td>-type linear | log</td><td>Sets the axis scale (applies to xy plots only).</td></tr></table>

# Returns

String.

# Example

```txt
set_axis_prop -axis y1 -title "Drain Current"  
##-> 0 
```

# set_band_diagram

Creates a band diagram. For details, see Plotting Band Diagrams on page 91.

# Syntax

```txt
set_band_diagram [<stringList>] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringList&gt;</td><td>List of plots created with the cutline function.</td></tr></table>

# Returns

Integer.

# Example

```txt
set_band_diagram Plot_1
##-> 0 
```

# set_best_look

Automatically configures various plot parameters. For details, see Best Look Option on page 89.

# Syntax

```tcl
set_best_look [<stringList>] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringList&gt;</td><td>List of plots to apply best look settings.</td></tr></table>

# Returns

Integer.

# Example

```tcl
set_best_look {Plot_1 Plot_2}  
#-> 0 
```

# set_camera_prop

Sets camera properties.

Note:

The command applies to 3D plots only.

# Syntax

```tcl
set_camera_prop
[-dolly_ZOOM_on | -dolly_ZOOM_off]
[-focal_point {<x> <y> <z>} ]
[-parallel | -perspective]
[-plot stringValue ]
[-position {<x> <y> <z>} ] [-reset]
[-rot_color <#rrggb>] [-rot_size <intValue>] 
[-rot_width <intValue ]
[-rotation_point {<x> <y> <z>} ]
[-setup <listdoubleList>] 
[-showRotation_point | -hideRotation_point]
[-view_angle <doubleValue>] [-view_up <doubleList>] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-dolly_ZOOM_on | -dolly_ZOOM_off</td><td>Sets to use dolly zoom instead of modifying the view angle when zooming.</td></tr><tr><td>-focal_point {&lt;x&gt;&lt;y&gt;&lt;z}</td><td>Sets the focal point of the camera.</td></tr><tr><td>-parallel | -perspective</td><td>Sets the projection mode in which to display the plot; either parallel or perspective projection.</td></tr><tr><td>-plot &lt;plotName&gt;</td><td>Name of the plot. If not specified, the command uses the selected plot.</td></tr><tr><td>-position {&lt;x&gt;&lt;y&gt;&lt;z}</td><td>Sets the position of the camera.</td></tr><tr><td>-reset</td><td>Reset camera settings to their default values.</td></tr><tr><td>-rot_color &lt;#rrggbb&gt;</td><td>Sets the color of the rotation point.</td></tr><tr><td>-rot_size &lt;intValue&gt;</td><td>Sets the size of the rotation point.</td></tr><tr><td>-rot_width &lt;intValue&gt;</td><td>Sets the width of the rotation point.</td></tr><tr><td>-rotation_point {&lt;x&gt;&lt;y&gt;&lt;z}</td><td>Sets the rotation point of the structure.</td></tr><tr><td>-setup &lt;listdoubleList&gt;</td><td>Specifies the new setup of the camera.</td></tr><tr><td>-showRotation_point | -hideRotation_point</td><td>Shows or hides the rotation point on the plot.</td></tr><tr><td>-view_angle &lt;doubleValue&gt;</td><td>Sets the view angle of the camera in degrees.</td></tr><tr><td>-view_up &lt;doubleList&gt;</td><td>Sets the view-up vector of the camera.</td></tr></table>

# Returns

Integer.

# Example

```tcl
set_camera_prop -rotation_point {0.2 0.35 -0.25}  
##-> 0 
```

# set_contour_labels_prop

Sets properties of contour labels.

# Syntax

```txt
set_contour_labels_prop <stringList>  
[-anchor left | center | right]  
[-color_bg <#rrggbb>]  
[-font_att normal | bold | italic | underline | strikeout]  
[-font_color <#rrggbb>]  
[-font_factor <doubleValue>]  
[-font_family arial | courier | times]  
[-format engineering | fixed | preferred | scientific]  
[-geom <stringValue>]  
[-level.skip <intValue>]  
[-plot <stringValue>]  
[-precision <intValue>]  
[-reset]  
[-show_bg | -hide_bg]  
[-show_index | -hide_index]  
[-spacing <intValue>] 
```

# Argument

# Description

<stringList>

List of fields on which to apply the specified properties.

-anchor left | center | right

Sets the contour labels anchor.

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-color_bg &lt;#rrggbb&gt;</td><td>Sets the background color of the contour labels.</td></tr><tr><td>-font_att normal | bold | italic | underline | strikeout</td><td>Sets the font attribute of the contour labels.</td></tr><tr><td>-font_color &lt;#rrggbb&gt;</td><td>Sets the color of the contour labels.</td></tr><tr><td>-font_factor &lt;doubleValue&gt;</td><td>Sets font factor of the contour labels.</td></tr><tr><td>-font_family Arial | courier | times</td><td>Sets the font type of the contour labels.</td></tr><tr><td>-format engineering | fixed | preferred | scientific</td><td>Sets the format of the contour labels.</td></tr><tr><td>-geom &lt;stringValue&gt;</td><td>Name of the dataset (or geometry). If not specified, then the command uses the main one from the active plot.</td></tr><tr><td>-level.skip &lt;intValue&gt;</td><td>Sets the level skip of the contour labels. The value 0 means every level is labeled.</td></tr><tr><td>-plot &lt;stringValue&gt;</td><td>Name of the plot. If not specified, then the command uses the selected plot.</td></tr><tr><td>-precision &lt;intValue&gt;</td><td>Sets the precision of the contour labels.</td></tr><tr><td>-reset</td><td>Reset the contour labels properties.</td></tr><tr><td>-show_bg | -hide_bg</td><td>Shows or hides the background of the contour labels.</td></tr><tr><td>-show_index | -hide_index</td><td>Shows or hides the contour labels index.</td></tr><tr><td>-spacing &lt;intValue&gt;</td><td>Sets the spacing of the contour labels.</td></tr></table>

# Returns

Integer.

# Example

set_contour_labels_prop {BandGap DopingConcentration} -precision 3 #-> 0

# set_curve_prop

Sets curve properties.

# Note:

The command applies to xy plots only.

# Syntax

```txt
set Curry_prop <stringList>  
[-axis left | right] [-color <#rrggbb>] [-deriv <intValue> | -integer]  
[-function <stringValue>] [-label <stringValue>]  
[-line_style solid | dot | dash | dashdot | dashdotdot]  
[-line_width <intValue>]  
[-markers_size <intValue>]  
[-markers_type circle | circlef | square | squaref | diamond | diamonddf | cross | plus]  
[-plot <stringValue>]  
[-reset]  
[-show | -hide] [-showleiend | -hideleiend]  
[-show_line | -hide_line]  
[-show/markers | -hide/markers]  
[-xScale <doubleValue>] [-xShift <doubleValue>]  
[-yScale <doubleValue>] [-yShift <doubleValue>] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringList&gt;</td><td>List of curves on which to apply the specified properties.</td></tr><tr><td>-axis left | right</td><td>Plots values on the left or right y-axis.</td></tr><tr><td>-color &lt;#rrggb&gt;</td><td>Sets color of the curve. Does not apply to discrete traps.</td></tr><tr><td>-deriv &lt;intValue&gt; | -integ</td><td>Options are:Derives the curve, specifying the order of the derivative (either first order or second order).Integrates the curve.</td></tr><tr><td>-function &lt;stringValue&gt;</td><td>Applies a function to a curve. For details on functions, see Appendix D on page 405.</td></tr><tr><td>-label &lt;stringValue&gt;</td><td>Sets a label to the curve.</td></tr><tr><td>-line_style solid | dot | dash | dashdot | dashdotdot</td><td>Sets style of the curve line. Does not apply to discrete traps.</td></tr><tr><td>-line_width &lt;intValue&gt;</td><td>Sets line width of the curve line. Does not apply to discrete traps.</td></tr><tr><td>-markers_size &lt;intValue&gt;</td><td>Sets size of the markers.</td></tr><tr><td>-markers_type circle | circlef | square | squaref | diamond | diamondf | cross | plus</td><td>Sets type of markers of the curve.</td></tr><tr><td>-plot &lt;stringValue&gt;</td><td>Name of the plot. If not specified, the command uses the selected plot.</td></tr><tr><td>-reset</td><td>Resetts curve parameters.</td></tr><tr><td>-show | -hide</td><td>Shows or hides the specified curves.</td></tr><tr><td>-show_Xlgend | -hide_Xlgend</td><td>Shows or hides the curve title from the legend.</td></tr><tr><td>-show_line | -hide_line</td><td>Shows or hides the curve line. Does not apply to discrete traps.</td></tr><tr><td>-show/markers | -hide/markers</td><td>Shows or hides the curve markers. Does not apply to discrete traps.</td></tr><tr><td>-xScale &lt;doubleValue&gt;</td><td>Sets the x-scale of the curve.</td></tr><tr><td>-xShift &lt;doubleValue&gt;</td><td>Sets the x-shift of the curve.</td></tr><tr><td>-yScale &lt;doubleValue&gt;</td><td>Sets the y-scale of the curve.</td></tr><tr><td>-yShift &lt;doubleValue&gt;</td><td>Sets the y-shift of the curve.</td></tr></table>

# Returns

None.

# Example

set_curve_prop Curve_1 -label "NetActive Field (Cut from structure_1 at $\scriptstyle \mathbf { x } = 0$ )"

# set_cutline_prop

Changes cutline properties.

Note:

This command applies to 2D and 3D plots only.

# Syntax

```tcl
set Outline_prop <stringValue> -plot <stringValue>  
[-handles_color <#rrggbb>]  
[-label_normal | -label_op] [-label_pos 0 | 1]  
[-label_size <doubleValue>] [-line_color <#rrggbb>]  
[-line_style solid | dot | dash | dashdot | dashdotdot]  
[-line_width <intValue>]  
[-pos1 {<x> <y> [<z]]} [-pos2 {<x> <y> [<z]]}  
[-showhandles | -hidehandles] [-show_label | -hide_label] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringValue&gt;</td><td>Name of the outline from which the property will be returned.</td></tr><tr><td>-plot&lt;stringValue&gt;</td><td>Name of the plot in which the outline is located.</td></tr><tr><td>%-handles_color[#rrggb]</td><td>Sets the color of the handles.</td></tr><tr><td>%-label_normal | -label_op</td><td>Sets the side of the label with respect to the endpoint of the label where the label will be displayed.</td></tr><tr><td>%-label_pos 0 | 1</td><td>Sets the label position. The value can be either 0 or 1 indicating the edge of the outline.</td></tr><tr><td>%-label_size &lt;doubleValue&gt;</td><td>Sets the label size of the outline.</td></tr><tr><td>%-line_color[#rrggb]</td><td>Sets the color of the outline.</td></tr><tr><td>%-line_style solid | dot | dash | dashdot | dashdotdot</td><td>Sets the style of the outline.</td></tr><tr><td>-line_width&lt;intValue&gt;</td><td>Sets the width of the outline.</td></tr><tr><td>-pos1{&lt;x&gt;&lt;y&gt;[&lt;z&gt;]</td><td>Sets the position of the first point of the outline.</td></tr><tr><td>-pos2{&lt;x&gt;&lt;y&gt;[&lt;z&gt;]</td><td>Sets the position of the second point of the outline.</td></tr><tr><td>-show Handles | -hide Handles</td><td>Shows or hides the handles of the outline.</td></tr><tr><td>-show_label | -hide_label</td><td>Shows or hides the label of the outline.</td></tr></table>

# Returns

Integer.

# Example

```tcl
set Outline_prop C1 -plot Plot_2D -pos1{0.1 2.7891 0}  
#->0 
```

# set_cutplane_prop

Changes cutplane properties.

Note:

This command applies to 3D plots only.

# Syntax

```tcl
set-cutplane_prop <stringValue> -plot <stringValue>  
[-at <doubleValue> | -normal {<X> <Y> <Z>} -origin {<X> <Y> <Z>} ]  
[-label_position <intValue>]  
[-label_size <doubleValue>]  
[-show_label | -hide_label] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringValue&gt;</td><td>Name of the cutplane in which the properties will be changed.</td></tr><tr><td>-plot&lt;stringValue&gt;</td><td>Name of the plot in which the cutplane is located.</td></tr><tr><td>-at&lt;doubleValue&gt; | -normal{X&gt;&lt;Y&gt;&lt;Z} -origin{X&gt;&lt;Y&gt;&lt;Z}</td><td>Sets the values of the position of the cutplane. If the cutplane is an -at type, the -at property is available. Otherwise, the normal and origin properties can be changed.</td></tr><tr><td>-label_position&lt;intValue&gt;</td><td>Sets the label position. The value can be 0, 1, or 2, indicating different corners of the cutplane.</td></tr><tr><td>-label_size&lt;doubleValue&gt;</td><td>Sets the label size of the cutplane.</td></tr><tr><td>-show_label| -hide_label</td><td>Shows or hides the label of the cutplane.</td></tr></table>

# Returns

Integer.

# Example

```tcl
set_cutplane_prop C1 -plot Plot_3D -at 0.483
##-> 0
```

# set_deformation

Sets the deformation properties for a structure, or creates a plot with an already deformed structure.

# Note:

The command applies to 2D and 3D plots only.

# Syntax

```txt
set_deformation<stringValue>[-factordoubleValue] -reset] [-new.plot] [-plot<stringValue>] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringValue&gt;</td><td>Name of the vector field to be used to deform the structure.</td></tr><tr><td>-factor | -reset</td><td>Factor to be applied to the deformation. The value must be greater than zero. If not specified, the default value is 1. Alternatively, reset the current deformation.</td></tr><tr><td>-new_plot</td><td>Creates a new plot.</td></tr><tr><td>-plot &lt;stringValue&gt;</td><td>Name of the plot to be used to deform the structure. If not specified, the command uses the selected plot.</td></tr></table>

# Returns

String (name of affected plot).

# Example

```txt
set_deformation -plot Plot_n60_des Displacement-V -factor 1e2  
##-> Plot_n60_des 
```

# set_ellipse_prop

Sets the properties of an ellipse.

# Syntax

```txt
setellipse_prop <stringValue> [-fill_color <#rrggb>] [-line_color <#rrggb>] [-line_style solid | dot | dash | dashdot | dashdotdot] [-line_width <intValue>] [-p1 <doubleList>] [-p2 <doubleList>] [-plot <stringValue>] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringValue&gt;</td><td>Name of the ellipse.</td></tr><tr><td>-fill_color</td><td>Specifies the fill color for the ellipse. Default: transparent.</td></tr><tr><td>-line_color</td><td>Specifies line color of the ellipse.</td></tr><tr><td>-line_style solid | dot | dash | dashdot | dashdotdot</td><td>Specifies line style of the ellipse.</td></tr><tr><td>-line_width</td><td>Specifies the line width.</td></tr><tr><td>-p1</td><td>Specifies the upper-left corner of the invisible rectangle in which the ellipse is drawn.</td></tr><tr><td>-p2</td><td>Specifies the lower-right corner of the invisible rectangle in which the ellipse is drawn.</td></tr><tr><td>-plot</td><td>Name of the plot where the command will search for the ellipse. If not specified, the command uses the selected plot.</td></tr></table>

# Returns

String.

# Example

```txt
set_ellipse_prop Ellipse_1 -fill_color red -line_style dash
##-> 0
```

# set_field_prop

Sets field properties for the specified field name (<stringValue>). If the field name is not specified, the properties are set for the selected field.

# Note:

The command applies to 2D and 3D plots only.

# Syntax

```txt
set_field_prop <stringValue>  
[-contour_labels_on | -contour_labels_off]  
[-custom_levels <doubleList> |  
-scale (linear | log | asinh | logabs) -levels <intValue>]  
[-geom <stringValue>] [-interpolated_values | -primary_values]  
[-label <stringValue>] [-line_color <stringValue>]  
[-line_width <intValue>]  
[-max <doubleValue>] [-max_auto | -max FIXED]  
[-min <doubleValue>] [-min_auto | -min FIXED]  
[-plot <stringValue>] [-range {<min> <max>} | -reset]  
[-show | -hide] [-show_bands | -hide_bands] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringValue&gt;</td><td>Name of the field.</td></tr><tr><td>-contour_labels_on | -contour_labels_off</td><td>Shows or hides the contour labels of the selected field.</td></tr><tr><td>custom_levels &lt;doubleList&gt;</td><td>Specifies a custom list of levels.</td></tr><tr><td>-geom &lt;stringValue&gt;</td><td>Name of the dataset (or geometry). If not specified, the command uses the main one from the active plot.</td></tr><tr><td>-interpolated_values | -primary_values</td><td>Specifies whether the primary values of a cell or the interpolated values on its vertices are used for visualization (this property is only valid for fields defined on cells).</td></tr><tr><td>-label &lt;stringValue&gt;</td><td>Specifies the label of the selected field.</td></tr><tr><td>-line_color &lt;color&gt;</td><td>Sets the color of the contour lines.</td></tr><tr><td>-line_width &lt;intValue&gt;</td><td>Sets the width of the contour lines.</td></tr><tr><td>-max &lt;doubleValue&gt;</td><td>Sets the maximum value of the field.</td></tr><tr><td>-max_AUTO | -max.fixed</td><td>Sets the maximum value of the field automatically, or fixes the maximum value of the field. If -max.fixed is specified and, for example, plots are linked, the change to the field values does not update the range.</td></tr><tr><td>-min</td><td>Sets the minimum value of the field.</td></tr><tr><td>-min_AUTO | -min.fixed</td><td>Sets the minimum value of the field automatically, or fixes the minimum value of the field. If -min.fixed is specified and, for example, plots are linked, the change to the field values does not update the range.</td></tr><tr><td>-plot</td><td>Name of the plot. If not specified, the command uses the selected plot.</td></tr><tr><td>-range {{min} {max}} | -reset</td><td>Sets range of the field contour plot, or resets to the default values.</td></tr><tr><td>-scale linear | log | asinh | logabs</td><td>Sets a scale with the specified &lt;intValue&gt; levels. The default is linear.</td></tr><tr><td>-levels &lt;intValue&gt;</td><td>Do not use with the -custom_levels argument.</td></tr><tr><td>-show | -hide</td><td>Shows or hides the contour plot.</td></tr><tr><td>-show_bands | -hide_bands</td><td>Shows or hides contour bands.</td></tr></table>

# Returns

Integer.

# Example

```txt
set_field_prop -range \{-1e20 1e20\}  
#-> 0 
```

# set_grid_prop

Sets grid properties.

Note:

The command applies to xy and 2D plots only.

# Syntax

```txt
set_grid_prop
[-align left | right]
[-line1_color <#rrggbb>]  
[-line1_style solid | dot | dash | dashdot | dashdotdot]  
[-line1_width <intValue>]  
[-line2_color <#rrggbb>]  
[-line2_style solid | dot | dash | dashdot | dashdotdot]  
[-line2_width <intValue>]  
[-plot <stringValue>]  
[-reset] [-show | -hide] [-showminorlines | -hideminorlines] 
```

# Argument

# Description

```txt
-align left | right Aligns of the grid to the left or right (applies to xy plots only).   
-line1_color <#rrggb> Sets color of the major grid lines.   
-line1_style solid | dot | Sets style of the major grid lines (applies to xy plots only).   
dash | dashdot | dashdotdot   
-line1_width <intValue> Sets width of the major grid lines.   
-line2_color <#rrggb> Sets color of the minor grid lines.   
-line2_style solid | dot | Sets style of the minor grid lines (applies to xy plots only).   
dash | dashdot | dashdotdot   
-line2_width <intValue> Sets width of the minor grid lines.   
-plot <stringValue> Name of the plot. If not specified, the command uses the selected plot.   
-reset Resets plot grid properties (applies to xy plots only).   
-show -hide Shows or hides the major grid lines.   
-showminorlines | Shows or hides the minor grid lines.   
-hideminorlines 
```

# Returns

None.

# Example

```txt
set_grid_prop -showminorlines 
```

# set_legend_prop

Sets legend properties.

These properties apply to xy plots only: -color_bg, -color_fg, -label_font_size, -location, and -margins.

These properties apply to 2D and 3D plots only: -label_format, -nof_labels, -orientation, and -precision.

# Syntax

```txt
set姒 legend_prop [-color_bg <#rrggbb>] [-color_fg <#rrggbb>] [-label.Font_att normal | bold | italic | underline | strikeout] [-label.Font_color <#rrggbb>] [-label.Font_factor <doubleValue>] [-label.Font_family Arial | courier | times] [-label.Font_size <intValue>] [-label_format preferred | scientific | engineering | fixed] [-location top_left | top_right | bottom_left | bottom_right] [-margins <intList>] [-nof_labels <intValue>] [-orientation vertical | horizontal] [-plot stringValue] [-position {x> y}] [-precision <intValue>] [-reset] [-showbackground | -hidebackground] [-size {x> y}] [-title.Font_att normal | bold | italic | underline | strikeout] [-title.Font_color <#rrggbb>] [-title.Font_factor <doubleValue>] [-title.Font_family Arial | courier | times] 
```

# Argument

# Description

-color_bg <#rrggbb>

Sets background color (xy plots only).

-color_fg <#rrggbb>

Sets foreground color (xy plots only).

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-label_font_att normal | 
bold | italic | underline | 
strikeout</td><td>Sets the attribute for the labels font.</td></tr><tr><td>-label.Font_color &lt;#rrggb&gt;</td><td>Sets font color of labels.</td></tr><tr><td>-label.Font_factor 
 doubleValue&gt;</td><td>Sets the font size of labels by specifying a factor for resizing the 
 font (2D and 3D plots only).</td></tr><tr><td>-label.Font_family Arial | 
 courier | times</td><td>Sets labels font.</td></tr><tr><td>-label.Font_size &lt;intValue&gt;</td><td>Sets the font size for the labels by specifying an integer (xy 
 plots only).</td></tr><tr><td>-label_format &lt;stringValue&gt;</td><td>Sets label format (2D and 3D plots only).</td></tr><tr><td>-location top_left | 
top_right | bottom_left | 
bottom_right</td><td>Sets legend location (xy plots only).</td></tr><tr><td>-margins &lt;intList&gt;</td><td>Sets legend margins (xy plots only).</td></tr><tr><td>-nof_labels &lt;intValue&gt;</td><td>Sets number of labels, (2D and 3D plots only).</td></tr><tr><td>-orientation vertical | 
horizontal</td><td>Sets legend orientation (2D and 3D plots only).</td></tr><tr><td>-plot &lt;stringValue&gt;</td><td>Name of the plot. If not specified, the command uses the 
 selected plot.</td></tr><tr><td>-position {&lt;x&gt; &lt;y&gt;}</td><td>Sets the legend position that is normalized to the window 
 coordinates between 0 and 1.</td></tr><tr><td>-precision &lt;intValue&gt;</td><td>Sets precision of labels (2D and 3D plots only).</td></tr><tr><td>-reset</td><td>Reset sets legend properties.</td></tr><tr><td>-showbackground | 
hidebackground</td><td>Sets the legend background as either solid or translucent.</td></tr><tr><td>-size {&lt;x&gt; &lt;y&gt;}</td><td>Sets the legend size normalized to window coordinates.</td></tr><tr><td>-title.Font_att normal | 
bold | italic | underline | 
strikeout</td><td>Sets the attribute for the legend title font.</td></tr><tr><td>-title.Font_color</td><td>Sets font color of legend title.</td></tr><tr><td>-title.Font_factor</td><td>Sets legend title font size using a factor to resize the font.</td></tr><tr><td>&lt;双重Value&gt;</td><td></td></tr><tr><td>-title.Font_family Arial | courier | times</td><td>Sets legend title font.</td></tr></table>

# Returns

None.

# Example

set_legend_prop -nof_labels 4 -orientation horizontal

# set_line_prop

Sets the properties of a line.

# Syntax

```txt
set_line_prop <stringValue>  
[-line_color <#rrggbb>]  
[-line_style solid | dot | dash | dashdot | dashdotdot]  
[-line_width <intValue>] [-p1 <doubleList>] [-p2 <doubleList>]  
[-plot <stringValue>] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringValue&gt;</td><td>Name of a line.</td></tr><tr><td>-line_color</td><td>Specifies the line color.</td></tr><tr><td>-line_style solid | dot | dash | dashdot | dashdotdot</td><td>Specifies the line style (xy plots only).</td></tr><tr><td>-line_width</td><td>Specifies the line width.</td></tr><tr><td>-p1</td><td>Specifies the start point of the line.</td></tr><tr><td>-p2</td><td>Specifies the end point of the line.</td></tr><tr><td>-plot</td><td>Name of the plot where the command will search for the line. If not specified, the command uses the selected plot.</td></tr></table>

# Returns

String.

# Example

```tcl
set_line_prop Line_1 -line_style dot -line_width 2
##-> 0 
```

# set_material_prop

Sets material properties.

If -plot is not specified, the properties are set for the selected material.

# Note:

The command applies to 2D and 3D plots only.

# Syntax

```txt
set_material_prop <stringList>  
[-border_color <#rrggbb>] [-border_width <intValue>]  
[-color <#rrggbb>]  
[-geom <stringValue>]  
[-mesh_color <#rrggbb>] [-mesh_width <intValue>]  
[-on | -off]  
[-particles_size <doubleValue>]  
[-plot <stringValue>]  
[-show_all | -hide_all] [-show_border | -hide_border]  
[-show_bulk | -hide_bulk] [-show_field | -hide_field]  
[-show_mesh | -hide_mesh] [-show_vector | -hide_vector]  
[-translucency_level <doubleValue>]  
[-translucency_on | -translucency_off] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringList&gt;</td><td>List of materials on which to apply the specified properties.</td></tr><tr><td>-border_color &lt;#rrggb&gt;</td><td>Specifies the border color of the materials. Color in format RGB is expected (see Colors on page 214).</td></tr><tr><td>-border_width &lt;intValue&gt;</td><td>Specifies the border width (in pixels) of the selected materials. The default width is 1 pixel with the following exceptions: 
• For depletion regions and overlays, the default width is 2 pixels.
• For junction lines, the default width is 3 pixels.
• For contacts and interfaces, the default width is 2 pixels for 2D geometries and 3 pixels for 3D geometries.</td></tr><tr><td>-color &lt;#rrggb&gt;</td><td>Specifies the bulk color of the materials. Color in format RGB is expected (see Colors on page 214).</td></tr><tr><td>-geom &lt;stringValue&gt;</td><td>Name of the dataset (or geometry). If not specified, uses the main one from the active plot.</td></tr><tr><td>-mesh_color &lt;#rrggb&gt;</td><td>Specifies the mesh color of the materials. Color in format RGB is expected (see Colors on page 214).</td></tr><tr><td>-mesh_width &lt;intValue&gt;</td><td>Specifies the mesh width (in pixels) of the selected materials. The default width is 1 pixel with the following exception: for interface regions, the default width is 2 pixels.</td></tr><tr><td>-on | -off</td><td>Shows or hides the material.</td></tr><tr><td>-particles_size &lt;doubleValue&gt;</td><td>Sets the size of particles of particle (kinetic Monte Carlo) material.</td></tr><tr><td>-plot &lt;stringValue&gt;</td><td>Name of the plot. If not specified, the command uses the selected plot.</td></tr><tr><td>-show_all | -hide_all</td><td>Shows or hides all the properties of the materials.</td></tr><tr><td>-show_border | -hide_border</td><td>Shows or hides the border of the materials.</td></tr><tr><td>-show_bulk | -hide_bulk</td><td>Shows or hides the bulk of the materials.</td></tr><tr><td>-show_field | -hide_field</td><td>Shows or hides the scalar fields of the materials.</td></tr><tr><td>-showMESh | -hideMESh</td><td>Shows or hides the mesh of the materials.</td></tr><tr><td>-show_vector | -hide_vector</td><td>Shows or hides the vector fields of the materials.</td></tr><tr><td>-translucency_level &lt;doubleValue&gt;</td><td>Specifies the level of translucency when -translucency_on is specified.</td></tr><tr><td>-translucency_on | -translucency_off</td><td>Activates or deactivates the translucency of the materials.</td></tr></table>

# Returns

Integer.

# Example

set_material_prop {Oxide Silicon} -show_field #-> 0

# set_plot_prop

Sets plot properties.

# Syntax

```txt
set.plot_prop
[-axes_interchanged | -not.axes_interchanged]
[-bg-gradient | -bg_solid]
[-caption_font_size <intValue)]
[-caption_leader_on | -caption_leader_off]
[-caption_material | -caption_region]
[-color_bg <#rrggbb>] [-color_fg <#rrggbb]]
[-color_map_grayscale | default]
[-contacts_color_constant | list | map]
[-enable_path_limit | -disable_path_limit]
[-frame_width <intValue>] [-gradientColors <stringValue}]
[-keep Aspect_ratio | -not_keep Aspect_ratio]
[-materialcolorsclassic|vivid]
[-path_depth <intValue)]
[-plot<stringList}]
[-ratio_xtoy <doubleValue>] [-reset]
[-show | -hide] [-show.axes | -hide.axes]
[-show.axes_label | -hide.axes_label]
[-show.axes_title | -hide.axes_title]
[-show_cube Axes | -hide_cube Axes]
[-show(curve Lines | -hide(curveLines]
[-show(curve/markers | -hide(curve-markers]
[-show_grid | -hide_grid] [-show_hedg | -hide_hedg]
[-show major ticks | -hide major ticks]
[-show_maxmarker | -hide_maxmarker]
[-show_minmarker | -hide_minmarker]
[-showminorTicks | -hideminor ticks] [-show_path | -hide_path]
[-show地區s bg | -hide地區s bg] [-show_title | -hide_title]
[-tdr_state <stringValue> | -tdr_state_index <intValue>
[-title<stringValue)]
[-title.Font_att normal | bold | italic | underline | strikeout]
[-title.Font_color <#rrggbb)]
[-title.Font_factor <doubleValue)]
[-title.Font_family arial | courier | times]
[-title.Font_size <intValue ]
[transformation{<x><y><z>} 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-axes_interchanged | -not.axes_interchanged</td><td>Interchanges axes (xy plots only).</td></tr><tr><td>-bg-gradient | -bgSolid</td><td>Sets the plot background to display either a gradient or a solid color (2D and 3D plots only).</td></tr><tr><td>-caption_font_size</td><td>Sets the size of the caption font (3D plots only).</td></tr><tr><td>&lt;intValue&gt;</td><td></td></tr><tr><td>-captionleader_on | -captionleader_off</td><td>Sets the visibility of the caption leaders (3D plots only).</td></tr><tr><td>-caption_material | -caption_region</td><td>Specifies whether to display material names or region names as captions.</td></tr><tr><td>-color_bg &lt;#rrggb&gt;</td><td>Sets the background color used when a solid background is active.</td></tr><tr><td>-color_fg &lt;#rrggb&gt;</td><td>Sets the foreground color.</td></tr><tr><td>-color_map(grayscale | default</td><td>Sets the color map used in the plot (2D and 3D plots only). Values are: · When set to default, uses normal color map (full palette). · When set to grayscale, uses only grayscale colors.</td></tr><tr><td>-contacts_color constant | list | map</td><td>Sets the behavior of the contact colors. The list and map options must be configured in the user preferences first.</td></tr><tr><td>-enable_path_limit | -disable_path_limit</td><td>Activates or deactivates the path limit when the path is displayed in the plot title.</td></tr><tr><td>-frame_width &lt;intValue&gt;</td><td>Sets the plot frame width, which must be a positive integer value less than 8 (xy plots only).</td></tr><tr><td>-gradientColors &lt;stringValue&gt;</td><td>Sets the background colors to use when a gradient background is selected (2D and 3D plots only). The argument is a list of two colors, where the first is used as the top color and the second is used as the bottom color.</td></tr><tr><td>-keep_aspect_ratio | -not_keep_aspect_ratio</td><td>Configures the aspect ratio (2D and 3D plots only).</td></tr><tr><td>-materialColors classic | vivid</td><td>Sets the color scheme to be used for materials (2D and 3D plots only).</td></tr><tr><td>-path_depth &lt;intValue&gt;</td><td>Sets the number of path directory names to be displayed in the plot title (when activated). This number does not consider the file name. You must specify an integer between 0 and 99.</td></tr><tr><td>-plot &lt;stringList&gt;</td><td>Specifies a list of plot names. If not specified, the command uses the selected plot.</td></tr><tr><td>-ratio_xtoy &lt;doubleValue&gt;</td><td>Sets the x to y ratio of the plot (2D plots only).</td></tr><tr><td>-reset</td><td>Reset plots properties.</td></tr><tr><td>-show | -hide</td><td>Shows or hides the plot.</td></tr><tr><td>-show.axes | -hide.axes</td><td>Shows or hides the axes.</td></tr><tr><td>-show.axes_label | -hide.axes_label</td><td>Shows or hides the axes labels.</td></tr><tr><td>-show.axes_title | -hide.axes_title</td><td>Shows or hides the axes title.</td></tr><tr><td>-show_cube Axes | -hide_cube Axes</td><td>Shows or hides cube axes (3D plots only).</td></tr><tr><td>-show(curve Lines | -hide(curveLines)</td><td>Shows or hides the curve lines (xy plots only).</td></tr><tr><td>-show(curve/markers | -hide(curve/markers)</td><td>Shows or hides the curve markers (xy plots only).</td></tr><tr><td>-show_grid | -hide_grid</td><td>Shows or hides the grid (xy and 2D plots only).</td></tr><tr><td>-showlezegend | -hidelezegend</td><td>Shows or hides the plot legend.</td></tr><tr><td>-showmajorTicks | -hideMajorTicks</td><td>Shows or hides the major ticks (3D plots only).</td></tr><tr><td>-show_maxmarker | -hide_maxmarker</td><td>Shows or hides the maximum marker (2D and 3D plots only).</td></tr><tr><td>-show_minmarker | -hide_minmarker</td><td>Shows or hides the minimum marker (2D and 3D plots only).</td></tr><tr><td>-showminorTicks | -hideMinorTicks</td><td>Shows or hides the minor ticks (3D plots only).</td></tr><tr><td>-show_path | -hide_path</td><td>Shows or hides the path in the plot title.</td></tr><tr><td>-show_regions bg | -hide_regions bg</td><td>Shows or hides the background color of regions.</td></tr><tr><td>-show_title | -hide_title</td><td>Shows or hides the plot title.</td></tr><tr><td>-tdr_state &lt;stringValue&gt; | -tdr_state_index &lt;intValue&gt;</td><td>Sets the current TDR state from the state name or the state index (2D and 3D plots only). To display the last state, specify: -tdr_state_index -1</td></tr><tr><td>-title &lt;stringValue&gt;</td><td>Title of the plot.</td></tr><tr><td>-title.Font_att normal | bold | italic | underline | strikeout</td><td>Sets the attribute of the title font.</td></tr><tr><td>-title.Font_color &lt;#rrggbb&gt;</td><td>Sets the title font color.</td></tr><tr><td>-title.Font_factor &lt;doubleValue&gt;</td><td>Multiplies the font size by a factor (2D and 3D plots only).</td></tr><tr><td>-title.Font_family arial | courier | times</td><td>Sets the title font.</td></tr><tr><td>-title.Font_size &lt;intValue&gt;</td><td>Sets the font size of the title (xy plots only).</td></tr><tr><td>-transformation {&lt;x&gt; &lt;y&gt; &lt;z&gt;}</td><td>Sets a linear coordinate transformation (3D plots only).</td></tr></table>

# Returns

None.

# Example

set_plot_prop -title "Example 3D Structure" set_plot_prop -plot "Plot_n98_des Plot_n99_des" -color_bg #aa4534

# set_rectangle_prop

Sets the properties of a rectangle.

# Syntax

```txt
set_rectangle_prop <stringValue>  
[-fill_color <#rrggbb>] [-line_color <#rrggbb>]  
[-line_style solid | dot | dash | dashdot | dashdotdot]  
[-line_width <intValue>] [-p1 <doubleList>] [-p2 <doubleList>]  
[-plot <stringValue>] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringValue&gt;</td><td>Name of a rectangle.</td></tr><tr><td>-fill_color</td><td>Specifies the fill color of the rectangle. Transparency is the default (only for xy plots).</td></tr><tr><td>-line_color</td><td>Specifies the line color of the rectangle.</td></tr><tr><td>-line_style solid | dot | dash | dashdot | dashdotdot</td><td>Specifies the line style of the rectangle (only for xy plots).</td></tr><tr><td>-line_width</td><td>Specifies the line width of the rectangle.</td></tr><tr><td>-p1</td><td>Specifies the lower-left corner of the rectangle.</td></tr><tr><td>-p2</td><td>Specifies the upper-right corner of the rectangle.</td></tr><tr><td>-plot</td><td>Name of the plot where the command will search for the rectangle. If not specified, the command uses the selected plot.</td></tr></table>

# Returns

String.

# Example

```txt
set Rectangle_prop Rectangle_1 -line_width 5
    #-> 0 
```

# set_region_prop

Sets region properties.

If -plot is not specified, the properties are set for the selected region.

# Note:

The command applies to 2D and 3D plots only.

# Syntax

```txt
set_region_prop <stringList>  
[-border_color <#rrggbb>] [-border_width <intValue>]  
[-color <#rrggbb>]  
[-geom <stringValue>]  
[-mesh_color <#rrggbb>] [-mesh_width <intValue>]  
[-on | -off]  
[-particles_size <doubleValue>]  
[-plot <stringValue>]  
[-show_all | -hide_all] [-show_border | -hide_border]  
[-show_bulk | -hide_bulk] [-show)caption | -hide_caption]  
[-show_field | -hide_field]  
[-show meshes | -hide meshes] [-show_vector | -hide_vector]  
[-translucency_level <doubleValue>]  
[-translucency_on | -translucency_off] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringList&gt;</td><td>List of regions of the plot where the properties will be applied.</td></tr><tr><td>-plot&lt;stringValue&gt;</td><td>Name of the plot. If not specified, the command uses the selected plot.</td></tr><tr><td>-geom&lt;stringValue&gt;</td><td>Name of the dataset (or geometry). If not specified, the command uses the main one from the active plot.</td></tr><tr><td>-border_color&lt;Rrggb&gt;</td><td>Specifies the border color of the region. Color in format RGB is expected (see Colors on page 214).</td></tr><tr><td>-border_width&lt;intValue&gt;</td><td>Specifies the border width (in pixels) of the selected regions. The default width is 1 pixel with the following exceptions:·For depletion regions and overlays, the default width is 2 pixels.·For junction lines, the default width is 3 pixels.·For contacts and interfaces, the default width is 2 pixels for 2D geometries and 3 pixels for 3D geometries.</td></tr><tr><td>-color&lt;Rrggb&gt;</td><td>Specifies the bulk color of the region. Color in format RGB is expected (see Colors).</td></tr><tr><td>-mesh_color</td><td>Specifies the mesh color of the regions. Color in format RGB is expected (see Colors on page 214).</td></tr><tr><td>-mesh_width</td><td>Specifies the mesh width (in pixels) of the selected regions. The default width is 1 pixel with the following exception: for interface regions, the default width is 2 pixels.</td></tr><tr><td>-on | -off</td><td>Shows or hides the region.</td></tr><tr><td>-particles_size</td><td>Sets the size of particles of particle (kinetic Monte Carlo) regions.</td></tr><tr><td>-show_all | -hide_all</td><td>Shows or hides all the properties of the regions.</td></tr><tr><td>-show_border | -hide_border</td><td>Shows or hides the border of the regions.</td></tr><tr><td>-show_bulk | -hide_bulk</td><td>Shows or hides the bulk of the regions.</td></tr><tr><td>-show)caption | -hide_caption</td><td>Shows or hides captions (3D plots only).</td></tr><tr><td>-show_field | -hide_field</td><td>Shows or hides the scalar fields of the regions.</td></tr><tr><td>-show_mesh | -hide_mesh</td><td>Shows or hides the mesh of the regions.</td></tr><tr><td>-show_vector | -hide_vector</td><td>Shows or hides the vector fields of the regions.</td></tr><tr><td>-translucency_level</td><td>Specifies the level of translucency when the option -translucency_on is specified.</td></tr><tr><td>-translucency_on | -translucency_off</td><td>Activates or deactivates translucency of the regions.</td></tr></table>

# Returns

Integer.

# Example

set_region_prop{source gate drain} -showmesh $\# - > 0$

# set_ruler_prop

Sets ruler properties.

Note:

This command applies to 2D and 3D plots only.

# Syntax

```txt
set_ruler_prop [-color <#rrggbb>] [-id <intValue>] [-plot stringValue] [-pos1 stringValue] [-pos2 stringValue] [-precision intValue] [-show_label | -hide_label] [-snap_on | -snap_off] [-width <intValue>] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-color</td><td>Sets the color of the ruler.</td></tr><tr><td>-id</td><td>Specifies the ID of the ruler where the command will search for properties. If not specified, the command uses the last selected ruler.</td></tr><tr><td>-plot</td><td>Name of the plot where the command will apply the properties. If not specified, the command uses the selected plot.</td></tr><tr><td>-pos1</td><td>Sets the position of the first point of the ruler.</td></tr><tr><td>-pos2</td><td>Sets the position of the second point of the ruler.</td></tr><tr><td>-precision</td><td>Sets the decimal precision of the measurements.</td></tr><tr><td>-show_label | -hide_label</td><td>Specifies whether to show or hide the ruler label.</td></tr><tr><td>-snap_on | -snap_off</td><td>Specifies whether to activate the snap-to-mesh feature.</td></tr><tr><td>-width</td><td>Sets the width of the ruler in pixels.</td></tr></table>

# Returns

String.

# Example

```txt
set_ruler_prop -width 5 -precision 2
##-> 0 
```

# set_streamline_prop

Sets the properties of streamlines.

# Note:

This command applies to 2D and 3D plots only.

# Syntax

```txt
set_STREAMline_prop <stringList> -plot <stringValue>  
[-arrow_angle <intValue>] [-arrow_color <#rrggbb>]  
[-arrow_size <doubleValue>] [-arrow_step <doubleValue>]  
[-arrow_style solid | dash | dot | dashdot | dashdotted]  
[-arrow_width <intValue>] [-constant_arrows | -normal_arrow]  
[-line_color <#rrggbb>] [-line_resolution <doubleValue>]  
[-line_style solid | dash | dot | dashdot | dashdotted]  
[-line_width <intValue>]  
[-positiveDirection | -negativeDirection]  
[-show_arrows | -hide_arrows] [-show_line | -hide_line] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringList&gt;</td><td>List of the streamlines to be modified.</td></tr><tr><td>-plot</td><td>Name of the plot where the command will search for streamlines. If not specified, the command uses the selected plot.</td></tr><tr><td>-arrow_angle</td><td>Specifies the arrowhead angle in degrees. It must be between 1 and 89.</td></tr><tr><td>-arrow_color</td><td>Specifies the color of the arrows.</td></tr><tr><td>-arrow_size</td><td>Specifies the size of the arrows.</td></tr><tr><td>-arrow_step</td><td>Specifies the step between arrows. This value must be greater than the line resolution.</td></tr><tr><td>-arrow_style solid | dash | dot | dashdot | dashdotdot</td><td>Specifies the arrow line style.</td></tr><tr><td>-arrow_width</td><td>Specifies the width of the arrowheads.</td></tr><tr><td>-constant_arrow | -normal_arrow</td><td>Specifies whether the size of the arrowheads on screen does not change regardless of the zoom level (-constant_arrow), or whether the size of the arrowheads changes on screen depending on the zoom level (-normal_arrow).</td></tr><tr><td>-line_color &lt;#rrggb&gt;</td><td>Specifies the color of the line.</td></tr><tr><td>-line_resolution</td><td rowspan="2">Specifies the distance between the points that conform the line. Lower values imply better line quality but lower performance.</td></tr><tr><td>&lt;doubleValue&gt;</td></tr><tr><td>-line_style solid | dash | dot | dashdot | dashdotdot</td><td>Specifies the line style.</td></tr><tr><td>-line_width &lt;intValue&gt;</td><td>Specifies the width of the line.</td></tr><tr><td>-positiveDirection | -negativeDirection</td><td>Specifies whether the arrow will be shown in the normal view or inverted view. Default: -positiveDirection.</td></tr><tr><td>-show_arrows | -hide_arrows</td><td>Shows or hides the arrows.</td></tr><tr><td>-show_line | -hide_line</td><td>Shows or hides the line.</td></tr></table>

# Returns

Integer.

# Example

set_streamline_prop Streamline_1 -plot Plot_2D -arrow_angle 45 #-> 0

# set_tag_prop

Prints text in a box.

The text displayed can be changed only with the argument -custom_text. The size of the text depends on the box size.

# Note:

The command applies only to 2D and 3D plots.

# Syntax

```txt
set_tag_prop [-custom_text <stringValue>] [-plot <stringValue>] [-show | -hide] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-custom_text</td><td>Specifies the text to be displayed. The text is not shown unless -show is specified.</td></tr><tr><td>-plot</td><td>Names of the plot where the tag will be displayed. If not specified, the command uses the selected plot.</td></tr><tr><td>-show | -hide</td><td>Shows or hides the text.</td></tr></table>

# Returns

Integer.

# Example

```tcl
set_tag_prop -plot Plot_2D -custom_text "Test to be displayed." -show
##->0
```

# set_textbox_prop

Sets the specified properties of a text box.

# Note:

This command applies to xy and 2D plots only.

# Syntax

```txt
set_textbox_prop <stringValue>  
[-anchor_pos {<x> <y>} ] [-arrow_size <intValue>]  
[-font_att normal | bold | italic | underline | strikeout]  
[-font_color <#rrggb>] [-font_factor <doubleValue>]  
[-font_family arial | courier | times] [-font_size <intValue>]  
[-line_color <#rrggb>]  
[-line_style solid | dot | dash | dashdot | dashdotdot]  
[-line_width <intValue>]  
[-plot <stringValue>]  
[-pos {<x> <y>} ] [-rotation <intValue>]  
[-showanchor | -hideanchor] [-show_border | -hide_border]  
[-text <stringValue>] 
```

```prolog
Argument Description  
<stringValue> Name of the text box to be modified.  
-anchor_pos {<x><y>} Specifies the anchor position using the world coordinate system (only for 2D plots).  
-arrow_size <intValue> Specifies the arrow size (only for 2D plots).  
-font_att normal | bold | italic | underline | strikeout Specifies the font attribute of the text. Several attributes can be combined using braces. For example: -font_att {bold italic}  
-font_color <#rrggb> Specifies the color of the text font.  
-font_factor <doubleValue> Specifies the multiplier for the text font (only for 2D plots).  
-font_family Arial | courier | times Specifies the text font family.  
-font_size <intValue> Specifies the font size (only for xy plots).  
-line_color <#rrggb> Specifies the line and arrow color (only for 2D plots).  
-line_style solid | dot | dash | dashdot | dashdotdot Specifies the representation style of the text box line (only for 2D plots). 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-line_width &lt;intValue&gt;</td><td>Specifies the width of the text box and anchor line (only for 2D plots).</td></tr><tr><td>-plot &lt;stringValue&gt;</td><td>Name of the plot where the command will search for the text box. If not specified, the command uses the selected plot.</td></tr><tr><td>-pos {&lt;x&gt; &lt;y&gt;}</td><td>Specifies the lower-left corner position of the text box. For xy plots, this is a point in the world coordinate system {x, y}. For 2D plots, this is a relative normalized screen coordinates pair (from 0.0 to 1.0).</td></tr><tr><td>-rotation &lt;intValue&gt;</td><td>Specifies the rotation of the text box in degrees (only for xy plots).</td></tr><tr><td>-showanchor | -hideanchor</td><td>Shows or hides the text box anchor (only for 2D plots).</td></tr><tr><td>-show_border | -hide_border</td><td>Shows or hides the text box border (only for 2D plots).</td></tr><tr><td>-text &lt;stringValue&gt;</td><td>Specifies the text in the text box.</td></tr></table>

# Returns

Integer.

# Example

set_textbox_prop Textbox_1 -text "Label Text" -font_color #ff0000 #-> 0

# set_transformation

Applies a transformation to a certain geometry. You can scale a geometry, shift a geometry, or both scale and shift a geometry.

# Note:

This command applies to 2D and 3D plots only.

# Syntax

```tcl
set_transformation
- scale {<scaleX> <scaleY> <scaleZ>} |
- shift {<shiftX> <shiftY> <shiftZ>} |
- scale {<scaleX> <scaleY> <scaleZ>} -shift {<shiftX> <shiftY> <shiftZ>} [-geom <stringValue>] [-plot <stringValue>] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-scale {{scaleX} {scaleY} {scaleZ}}</td><td>Sets or returns the scale value of the axis. The list has the form {x y z} where the parameters x, y, and z are positive doubles that represent the scale value applied to each axis.</td></tr><tr><td>-shift {{shiftX} {shiftY} {shiftZ}}</td><td>Sets or returns the shift value of the axis. The list has the form {x y z} where the parameters x, y, and z are doubles that represent the shift value applied to each axis.</td></tr><tr><td>-geom {stringValue}</td><td>Name of the geometry in which the transformation will be applied.</td></tr><tr><td>-plot {stringValue}</td><td>Name of the plot from which the geometry will be obtained.</td></tr></table>

# Returns

Integer.

# Example

```txt
set Transformation -scale {0.5 1 1}  
#-> 0 
```

# set_value_blanking

Sets value blanking.

If -field is not specified, the command uses the selected field.

Note:

The command applies to 2D and 3D plots only.

# Syntax

```txt
set_value_blanking -field <stringValue>  
- less <doubleValue> | -greater <doubleValue> | -reset  
[-blank all | any | inter] [-cons <intValue>]  
[-plot <stringValue>] [-union | -intersection] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-field</td><td>Name of the field to set blanking parameters.</td></tr><tr><td>-less</td><td>If you specify -less, all values less than the specified value are blanked.</td></tr><tr><td>-greater</td><td>If you specify -greater, all values greater than the specified value are blanked.</td></tr><tr><td>-reset</td><td>Specify -reset to remove value blanking rules.</td></tr><tr><td>-blank all | any | inter</td><td>Selects the value blanking option where: 
• all is all vertices. 
• any is any vertex. 
• inter is interpolate vertices. 
If not specified, the command uses the all option.</td></tr><tr><td>-cons</td><td>Number of the value blanking rule. Options are between 1 and 8. Default: 1.</td></tr><tr><td>-plot</td><td>Name of the plot. If not specified, the command uses the selected plot.</td></tr><tr><td>-union | -intersection</td><td>Sets whether the constraints will be united or will intersect. 
If not specified, the command uses the -union option.</td></tr></table>

# Returns

Integer.

# Example

```txt
set_value_blanking -fieldDopingConcentration-greater0.0
	#-> 0 
```

# set_vector_prop

Sets the properties of a vector field.

# Note:

This command applies to 2D and 3D plots only.

# Syntax

```txt
set_vector_prop <stringValue>  
[-constant_heads | -normal_heads] [-fill_color <#rrggbb>]  
[-geom <stringValue>]  
[-head_angle <intValue>]  
[-head_shape arrow | arrowSolid | head | head Closed | head_solid]  
[-head_size <doubleValue>]  
[-line_color <#rrggbb>]  
[-line_pattern solid | dot | dash | dashdot | dashdotdot]  
[-line_width <intValue>]  
[-plot <stringValue>]  
[-scale_grid | uniform]  
[-scale_factor_grid <doubleValue>]  
[-scale_factor_uniform <doubleValue>] [-show | -hide] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringValue&gt;</td><td>Name of the vector field to be modified.</td></tr><tr><td>-constant_heads | -normal_heads</td><td>Specifies whether the arrows are constant to the plot area regardless of the vector magnitude or proportional (normal) to the vector magnitude.</td></tr><tr><td>-fill_color &lt;#rrggbb&gt;</td><td>Specifies the color of a solid arrowhead. Otherwise, this argument has no effect.</td></tr><tr><td>-geom&lt;stringValue&gt;</td><td>Specifies the geometry where the command will search for the vector.</td></tr><tr><td>-head_angle &lt;intValue&gt;</td><td>Specifies the arrowhead angle in degrees. It must be between 1 and 89.</td></tr><tr><td>-head_shape arrow | arrow_solid | head | head Closed | head_solid</td><td>Specifies the shape of the arrows.</td></tr><tr><td>-head_size &lt;doubleValue&gt;</td><td>Specifies the length of the arrows.</td></tr><tr><td>-line_color &lt;#rrggb&gt;</td><td>Specifies the color of the arrows.</td></tr><tr><td>-line_pattern solid | dot | dash | dashdot | dashdotdot</td><td>Specifies the line pattern of the arrows.</td></tr><tr><td>-line_width &lt;intValue&gt;</td><td>Specifies the width of the arrows.</td></tr><tr><td>-plot &lt;stringValue&gt;</td><td>Name of the plot where the command will search for the geometry. If not specified, the command uses the selected plot.</td></tr><tr><td>-scale_grid | uniform</td><td>Specifies the scale for displaying the arrows, either uniform size or a grid display.</td></tr><tr><td>-scale_factor_grid &lt;doubleValue&gt;</td><td>Specifies the grid factor for displaying the arrows.</td></tr><tr><td>-scale_factor.uniform &lt;doubleValue&gt;</td><td>Specifies the uniform factor for displaying the arrows.</td></tr><tr><td>-show | -hide</td><td>Shows or hides the arrows.</td></tr></table>

# Returns

Integer.

# Example

set_vector_prop ElectricField-V -plot Plot_2D -geom 2D -scale grid#-> 0

# set_vertical_lines_prop

Sets the properties of vertical lines.

# Note:

This command applies to xy plots only.

# Syntax

```txt
set_vertical Lines_prop <stringValue> [-line_color <#rrggbb>] [-line_style solid | dot | dash | dashdot | dashdotdot] [-line_width <intValue>] [-plot <stringValue>] [-show | -hide] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringValue&gt;</td><td>Name of a vertical line.</td></tr><tr><td>-line_color</td><td>Specifies the color of the vertical line.</td></tr><tr><td>-line_style solid | dot | dash | dashdot | dashdotdot</td><td>Specifies the style of the vertical line.</td></tr><tr><td>-line_width</td><td>Specifies the width of the vertical line in pixels.</td></tr><tr><td>-plot</td><td>Name of the plot where the command searches for the vertical line. If not specified, the command uses the selected plot.</td></tr><tr><td>-show | -hide</td><td>Shows or hides the vertical line.</td></tr></table>

# Returns

Integer.

# Example

```tcl
set_vertical Lines_prop VerticalLine _1 -line_style dot
##-> 0 
```

# set_window_full

Sets the full plot view.

# Syntax

```txt
set_window_full -on | -off 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-on | -off</td><td>Activates or deactivates the full plot view.</td></tr></table>

# Returns

Integer.

# Example

```c
set_window_full -on
##-> 0 
```

# set_window_size

Sets the size of the main window of the user interface.

# Syntax

```xml
set_window_size <width>x<height> 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;width&gt;x&lt;height&gt;</td><td>Sets the width and the height of the main window in pixels (minimum of 200×200 pixels).</td></tr></table>

# Returns

Integer.

# Example

```txt
set_window_size 1280x800  
#-> 0 
```

# show_msg

Displays a message in a dialog box.

# Syntax

```txt
show msg <stringValue> [-error | -info | -warning] [-title <stringValue>] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringValue&gt;</td><td>Specifies the text to be displayed.</td></tr><tr><td>-error | -info | -warning</td><td>Specifies the type of message to display. Default: -info.</td></tr><tr><td>-title &lt;stringValue&gt;</td><td>Specifies the title of the dialog box.</td></tr></table>

# Returns

None.

# Example

show_msg -warning -title "Bad Value" "There was a problem extracting the threshold voltage"

# start_movie

Starts the recording of a new movie by creating a new frame buffer.

# Note:

This command only starts the creation of a movie, so you must use the add_frame and export_movie commands to complete the operations.

# Syntax

start_movie [-resolution <width>x<height>]

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-resolution</td><td>Specifies the resolution of each captured frame in pixels. If not specified, uses the current screen resolution.</td></tr></table>

# Returns

None.

# Example

start_movie

# stop_movie

Stops recording a movie.

# Note:

This command deletes the stored frame buffer. It does not save it into a file.

# Syntax

stop_movie

# Returns

None.

# Example

stop_movie

# undo

Undoes the last command implemented or the number of commands specified.

# Syntax

undo [<intValue]

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;intValue&gt;</td><td>Number of commands to be reverted.</td></tr></table>

# Returns

None.

# Example

undo 2

# unload_file

Unloads all the datasets belonging to the specified file.

# Syntax

unload_file <stringValue>

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;stringValue&gt;</td><td>Name of the file.</td></tr></table>

# Returns

Integer.

# Example

unload_file structure2D.tdr #-> 0

# version

Returns the version of Sentaurus Visual.

# Syntax

version

# Returns

String.

# Example

version

#-> 31.0.7

# windows_style

Specifies the type of window style to use for the user interface of Sentaurus Visual.

# Syntax

```txt
windows_style [-aspect_ratio_on | -aspect_ratio_off] [-direction right_down | down_right] [-max <intValue>] [-sort <stringList>] [-style horizontal | vertical | grid | max | custom] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-aspect_ratio_on | -aspect_ratio_off</td><td>Specifies whether the aspect ratio is maintained for all the plots displayed.</td></tr><tr><td>-direction right_down | down_right</td><td>Specifies the viewing direction of plots and where they will stretch: · When using the right_down direction, the grid fills to the right until it is full and then continues adding new plots in a new row downwards from the first row. · When using the down_right direction, this order is inverted.</td></tr><tr><td>-max &lt;value&gt;</td><td>Specifies the maximum number of columns in which to display the plots when they are in a custom grid configuration.</td></tr><tr><td>-sort &lt;stringList&gt;</td><td>Specifies the plots to be displayed.</td></tr><tr><td>-style horizontal | vertical | grid | max | custom</td><td>Specifies a horizontal or vertical orientation, or grid style, or the use of maximum space or custom style.</td></tr></table>

# Returns

Integer.

# Example

windows_style -style grid

#-> 0

# zoom_plot

Zooms into a plot.

# Syntax

```txt
zoom_plot
- axis (x | y | z) - range {<min> <max>} |
- box {<minX> <maxX> <minY> <maxY> <minZ> <maxZ>} |
- factor <doubleValue>
- reset |
- window {<x1> <y1> [<z1>] <x2> <y2> [<z2>] }
[-plot <stringValue>] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-axis x | y | z</td><td>Specifies the axis where the range is applied.</td></tr><tr><td>-range {&lt;min&gt; &lt;max&gt;}</td><td>The -range argument defines the minimum and maximum values of the range.</td></tr><tr><td>-box {&lt;minX&gt; &lt;maxX&gt; &lt;minY&gt; &lt;maxY&gt; &lt;minZ&gt; &lt;maxZ&gt;}</td><td>Defines the three ranges for the boundary box.</td></tr><tr><td>-factor &lt;doubleValue&gt;</td><td>Sets the zoom factor. If the value is greater than 1, it zooms into a plot. If the value is smaller than 1, it zooms out of a plot.</td></tr><tr><td>-reset</td><td>Reset the zoom status of the plot.</td></tr><tr><td>-window {&lt;x1&gt; &lt;y1&gt; [&lt;z1&gt;] &lt;x2&gt; &lt;y2&gt; [&lt;z2&gt;]}</td><td>Sets the zoom window. It zooms into the specified window between two x,y pairs. For 2D and 3D plots, the argument accepts only four values. For 3D plots, the values can be entered in the form of pixels of the plot frame (integers) or can be normalized to screen values (doubles between 0 and 1).</td></tr><tr><td>-plot &lt;stringValue&gt;</td><td>Name of the plot.</td></tr></table>

# Returns

None.

# Example

zoom_plot -reset

# B

# BPython Commands

This appendix describes the Python commands that can be used in Sentaurus Visual.

The Python commands apply to the same plots and structures defined in the Tcl commands in Appendix A on page 213.

# General Information

Sentaurus Visual Python Mode imports the svisual package as sv automatically at the start of the application. This package contains the commands presented in this appendix.

As in Tcl mode, sv.echo() prints to the log file SVisualPy.log, and the print() function acts as the Tcl puts command printing to standard output.

# Accessing Documentation for Python Commands

To access the documentation for the Python commands, from the Sentaurus Visual GUI, choose Help $>$ Python API Reference.

Alternatively, you can use the help() function to access command information:

help(sv.<command_name>)

# Syntax Conventions

Each Python command is implemented as a Python function and, as such, it must comply with the Python syntax conventions.

# Get Property Commands

These commands share the syntax get_<object>_prop(). All these commands have a positional parameter called property, which receives a string with the name of the property requested. See the corresponding Tcl command for a list of the possible properties to query.

# Set Property Commands

These commands share the syntax set_<object>_prop() and have several keyword arguments, one for each property to be set.

# Common Properties

The following properties are used in several Python commands.

# Colors

In commands that allow you to specify color properties (such as the color argument), a string specifying red, green, and blue components of the RGB system is expected. The string is preceded by a hash (#) character, and each value is provided in hexadecimal form. Common colors also have aliases.

Table 15 Common colors   

<table><tr><td>Alias</td><td>General form</td><td>Description</td></tr><tr><td>white</td><td>#FFFFFF</td><td>White</td></tr><tr><td>black</td><td>#000000</td><td>Black</td></tr><tr><td>red</td><td>#ff0000</td><td>Red</td></tr><tr><td>darkRed</td><td>#800000</td><td>Dark red</td></tr><tr><td>lime</td><td>#00ff00</td><td>Light green</td></tr><tr><td>green</td><td>#008000</td><td>Dark green</td></tr><tr><td>darkGreen</td><td>#006400</td><td>Darker green</td></tr><tr><td>blue</td><td>#0000ff</td><td>Blue</td></tr><tr><td>darkBlue</td><td>#000080</td><td>Dark blue</td></tr><tr><td>cyan</td><td>#00fff</td><td>Cyan</td></tr><tr><td>darkCyan</td><td>#008080</td><td>Dark cyan</td></tr><tr><td>magenta</td><td>#ff00ff</td><td>Magenta</td></tr><tr><td>darkMagenta</td><td>#800080</td><td>Dark magenta</td></tr><tr><td>yellow</td><td>#fff00</td><td>Yellow</td></tr><tr><td>olive</td><td>#808000</td><td>Olive or dark yellow</td></tr><tr><td>orange</td><td>#fffa500</td><td>Orange</td></tr><tr><td>darkOrange</td><td>#ff8c00</td><td>Dark orange</td></tr><tr><td>gray</td><td>#a0a0a4</td><td>Gray</td></tr><tr><td>darkGray</td><td>#808080</td><td>Dark gray</td></tr><tr><td>lightGray</td><td>#c0c0c0</td><td>Light gray</td></tr><tr><td>skyblue</td><td>#87ceeb</td><td>Sky blue</td></tr><tr><td>slategray</td><td>#708090</td><td>Slate gray</td></tr><tr><td>chocolate</td><td>#d2691e</td><td>Chocolate</td></tr></table>

# Fonts

For commands that allow you to adjust font properties, Sentaurus Visual defines a specific list of font families and attributes.

Table 16 Font families and their attributes   

<table><tr><td>Font family</td><td>Attribute</td></tr><tr><td>Arial</td><td>Bold</td></tr><tr><td>Courier</td><td>Italic</td></tr><tr><td>Times</td><td>Normal</td></tr><tr><td></td><td>Strikeout</td></tr><tr><td></td><td>Underline</td></tr></table>

# Note:

In xy plots, the font size of different elements of the plot are set with the font_size argument; whereas in 2D and 3D plots, the font size cannot be set directly. Instead, the font size is set as a factor of the plot frame (the default value is 1.0), with the font_factor argument.

# Lines

For commands that allow you to adjust line properties (such as the line_style option), Sentaurus Visual defines a specific list of line styles. You can provide the name of the style or its short form directly.

Table 17 Line styles   

<table><tr><td>Name of line style</td><td>Short form of line style</td><td>Description</td></tr><tr><td>solid</td><td>-</td><td>Continuous line: __________</td></tr><tr><td>dot</td><td>.</td><td>Dotted line: ________________</td></tr><tr><td>dash</td><td>-</td><td>Dashed line: ________________</td></tr><tr><td>dashdot</td><td>-.</td><td>Alternating dash-and-dot line: -____________________</td></tr><tr><td>dashdotdot</td><td>-..</td><td>Alternating dash-and-two-dots line: -____________________</td></tr></table>

# Markers

Different markers are available to use in xy plots in Sentaurus Visual. You can use the name or the short form of each marker.

Table 18 Marker types   

<table><tr><td>Name of marker type</td><td>Short form of marker type</td><td>Description</td></tr><tr><td>circle</td><td>○</td><td>○</td></tr><tr><td>circlef</td><td>of</td><td>●</td></tr><tr><td>diamond</td><td></td><td>◇</td></tr><tr><td>diamondf</td><td></td><td>◆</td></tr><tr><td>square</td><td></td><td>□</td></tr><tr><td>squaref</td><td></td><td>■</td></tr><tr><td>plus</td><td>+</td><td>+</td></tr><tr><td>cross</td><td>x</td><td>x</td></tr></table>

# C

# CMenus and Toolbars of User Interface

This appendix describes the menus and toolbars of the user interface of Sentaurus Visual.

# Menus

This section lists the commands of the different menus.

# File Menu

Table 19 File menu   

<table><tr><td>Command</td><td>Button</td><td>Shortcut keys</td><td>Description</td></tr><tr><td>Open</td><td></td><td>Ctrl+O</td><td>Loads a dataset or multiple datasets.</td></tr><tr><td>Reload All</td><td></td><td>F5 key</td><td>Reloads all loaded datasets.</td></tr><tr><td>Reload Selected</td><td></td><td>Shift+F5</td><td>Reloads only the selected datasets.</td></tr><tr><td>Automatic Reload Dataset</td><td></td><td></td><td>Displays Automatic Reload Dataset dialog box, where you set up automatic reloading of datasets.</td></tr><tr><td>Export Plot</td><td></td><td>Ctrl+E</td><td>Exports the selected plots to an image.</td></tr><tr><td>Import Image</td><td></td><td>Ctrl+I</td><td>Displays the Import Image dialog box.</td></tr><tr><td>Run Script</td><td></td><td></td><td>Runs Tcl, Python, or Inspect scripts.</td></tr><tr><td>Print Plots</td><td></td><td>Ctrl+P</td><td>Prints the selected plots.</td></tr><tr><td>Recent Files</td><td></td><td></td><td>Lists the recently opened datasets, up to five.</td></tr><tr><td>Exit</td><td></td><td>Ctrl+Q</td><td>Quits Sentaurus Visual.</td></tr></table>

# Edit Menu

Table 20 Edit menu   

<table><tr><td>Command</td><td>Button</td><td>Shortcut keys</td><td>Description</td></tr><tr><td>Undo</td><td></td><td>Ctrl+Z</td><td>Reverts the last operation executed.</td></tr><tr><td>Select All Plots</td><td></td><td>Ctrl+A</td><td>Selects all the active plots.</td></tr><tr><td>Redraw All Plots</td><td></td><td>Ctrl+R</td><td>Redraws all the active plots.</td></tr><tr><td>Delete Selected Plots</td><td></td><td>Ctrl+D</td><td>Deletes all the selected plots.</td></tr><tr><td>Preferences</td><td></td><td></td><td>Displays User Preferences dialog box.</td></tr><tr><td>Draw</td><td></td><td></td><td>Displays the Draw toolbar for drawing lines, rectangles, and ellipses, and inserting text. Available for xy and 2D plots only.</td></tr></table>

# View Menu

Table 21 View menu   

<table><tr><td>Command</td><td>Button</td><td>Shortcut keys</td><td>Description</td></tr><tr><td>Panels</td><td></td><td></td><td>Shows or hides the Data Selection panel, Properties panel, and Tcl or Python Console.</td></tr><tr><td>Toolbars</td><td></td><td></td><td>Shows or hides the File, Edit, View, Tools, and Movies toolbars.</td></tr><tr><td>Select</td><td></td><td></td><td>Enables selection (default) mode.</td></tr><tr><td rowspan="2">Select/Rotate</td><td></td><td></td><td>Enables selection (default) mode.</td></tr><tr><td></td><td></td><td>Available for 3D points only.</td></tr><tr><td>Reset</td><td></td><td>Ctrl+Shift+F</td><td>Reset plots to the default values.</td></tr><tr><td>Zoom</td><td></td><td>Ctrl+Shift+Z</td><td>Enables zoom tool.</td></tr><tr><td>Scale to Image</td><td></td><td></td><td>Displays the Scale to Image dialog box, where you can overlay an image onto a plot.</td></tr><tr><td>Zoom to Ranges</td><td></td><td></td><td>Displays the Zoom to Ranges dialog box, where you can zoom by specifying the range of one of the three axes using the Box tab. Available for 3D plots only.</td></tr><tr><td>Best Look</td><td></td><td>Ctrl+Shift+L</td><td>Adjusts plotting parameters automatically. Available for xy plots only.</td></tr><tr><td>Spherical Rotation</td><td></td><td></td><td>Performs a spherical rotation of the view. Available for 3D plots only.</td></tr><tr><td>Rotation Axis X</td><td></td><td></td><td>Fixes the rotation of a 3D plot to the x-axis. Available for 3D plots only.</td></tr><tr><td>Rotation Axis Y</td><td></td><td></td><td>Fixes the rotation of a 3D plot to the y-axis. Available for 3D plots only.</td></tr><tr><td>Rotation Axis Z</td><td></td><td></td><td>Fixes the rotation of a 3D plot to the z-axis. Available for 3D plots only.</td></tr><tr><td>Rotate</td><td></td><td></td><td>Displays Rotate dialog box for rotate modes and angles for 3D plots. Available for 3D plots only.</td></tr><tr><td>View Plane XY</td><td></td><td></td><td>Shows a 3D plot in the xy plane. Available for 3D plots only.</td></tr><tr><td>View Plane YZ</td><td></td><td></td><td>Shows a 3D plot in the yz plane. Available for 3D plots only.</td></tr><tr><td>View Plane XZ</td><td></td><td></td><td>Shows a 3D plot in the xz plane. Available for 3D plots only.</td></tr><tr><td>Default View</td><td></td><td></td><td>Restores a 3D plot point of view. Available for 3D plots only.</td></tr><tr><td>Fast Draw</td><td></td><td></td><td>If selected, 3D plot becomes an outline during a rotation or move. Available for 3D plots only.</td></tr><tr><td>Subsampling</td><td></td><td></td><td>Activates or deactivates subsampling in 2D and 3D plots. Available for 2D and 3D plots only.</td></tr><tr><td>Camera Configuration</td><td></td><td></td><td>Camera configuration for 3D plots. Available for 3D plots only.</td></tr><tr><td>Lights Configuration</td><td></td><td></td><td>Lighting parameters for 3D plots. Available for 3D plots only.</td></tr></table>

# Tools Menu

Table 22 Tools menu   

<table><tr><td>Command</td><td>Button</td><td>Shortcut keys</td><td>Description</td></tr><tr><td>Link</td><td></td><td>Ctrl+L</td><td>Links two or more plot properties.</td></tr><tr><td>Special Link</td><td></td><td></td><td>Displays Special Link dialog box where you can set up special linking to link only specified properties.</td></tr><tr><td>Movies</td><td></td><td></td><td>Provides commands to start recording a movie, to add frames to a movie, and to stop recording a movie.</td></tr><tr><td>Probe</td><td></td><td>Ctrl+Shift+P</td><td>Probes the values on a plot.</td></tr><tr><td>Analysis</td><td></td><td></td><td>Performs analysis on a curve. Available for xy plots only.</td></tr><tr><td>Calculate Scalar</td><td></td><td></td><td>Displays the Calculate Scalar dialog box, where you can create a function to calculate scalar values. Available for xy plots only. See Performing Complex Mathematical Operations on 1D Data on page 95.</td></tr><tr><td>Precision Cuts</td><td></td><td></td><td>Displays the Cutlines and Cutplanes dialog box. Available for 2D and 3D plots only.</td></tr><tr><td>Outline</td><td></td><td>Ctrl+Shift+C</td><td>Generates a custom outline on a 2D plot. Available for 2D and 3D plots only.</td></tr><tr><td>Cut X</td><td></td><td>Ctrl+Shift=X</td><td>Generates a cutplane (3D) or cutline (2D) orthogonal to the x-axis. Available for 2D and 3D plots only.</td></tr><tr><td>Cut Y</td><td></td><td>Ctrl+Shift=Y</td><td>Generates a cutplane (3D) or cutline (2D) orthogonal to the y-axis. Available for 2D and 3D plots only.</td></tr><tr><td>Cut Z</td><td></td><td>Ctrl+Shift Z</td><td>Generates a cutplane (3D) or cutline (2D) orthogonal to the z-axis. Available for 2D and 3D plots only.</td></tr><tr><td>Ruler</td><td></td><td>Ctrl+Shift+R</td><td>Enables measuring distances. Available for 2D and 3D plots only.</td></tr><tr><td>Value Blanking</td><td></td><td>Ctrl+Shift+V</td><td>Displays Value Blanking dialog box. Available for 3D plots only.</td></tr><tr><td>Streamlines</td><td></td><td></td><td>Displays Streamlines dialog box where you can enable drawing streamlines of a vector field. Available for 2D and 3D plots only.</td></tr><tr><td>Overlay</td><td></td><td>Ctrl+Shift+Y</td><td>Overlays two or more plots onto one plot. Available for 2D and 3D plots only.</td></tr><tr><td>Diff Plots</td><td></td><td></td><td>Enables tool to plot the difference between common fields. Available for 2D and 3D plots only.</td></tr><tr><td>Integrate</td><td></td><td>∫dr</td><td></td></tr><tr><td>Create Projection</td><td></td><td></td><td>Displays the 2D Projection dialog box, where you can create a 2D minimum or maximum projection of a field from a 3D plot. Available for 3D plots only.</td></tr><tr><td>Deformation</td><td></td><td></td><td>Displays Deformation dialog box, where you can create a deformed structure in the same plot or in a new one. Available for 2D and 3D plots only.</td></tr><tr><td>Min/Max Field Value</td><td></td><td></td><td>Displays Minimum/Maximum Field Value dialog box, where you can select certain regions or materials for the search, and you can define a 3D box limiting the search area. Available for 2D and 3D plots only.</td></tr><tr><td>Create Isovalue</td><td></td><td></td><td>Displays Create Isovalue Geometry dialog box, where you can create a new geometry from a constant field value in a structure. Available for 2D and 3D plots only.</td></tr><tr><td>Surface Plot</td><td></td><td></td><td>Displays Surface Plot dialog box, where you can create a surface plot from a 3D dataset.</td></tr><tr><td>Extract Path</td><td></td><td></td><td>Displays Extract Path dialog box, where you can extract a path of either the minimum or maximum values of a specified scalar field.</td></tr></table>

# Data Menu

Table 23 Data menu   

<table><tr><td>Command</td><td>Button</td><td>Shortcut keys</td><td>Description</td></tr><tr><td>View Info Loaded</td><td></td><td></td><td>Displays Manage Loaded Data dialog box, showing all the datasets and plots currently loaded.</td></tr><tr><td>Curve Properties</td><td></td><td>Ctrl+Shift+E</td><td>Displays Curve Properties dialog box. Available for xy plots only.</td></tr><tr><td>Region Properties</td><td></td><td>Ctrl+Shift+E</td><td>Displays Region Properties dialog box. Available for 2D and 3D plots only.</td></tr><tr><td>Export XY Data</td><td></td><td></td><td>Displays Export XY Data dialog box. Available for xy plots only.</td></tr><tr><td>Save Plot</td><td></td><td></td><td>Displays a dialog box where you can save all the plot data and settings to a Tcl file. Available for xy plots only.</td></tr><tr><td>New XY Plot</td><td></td><td></td><td>Generates a new empty xy plot. Available for xy plots only.</td></tr><tr><td>Duplicate Plot</td><td></td><td></td><td>Duplicates the current plot as an xy plot. Available for xy plots only.</td></tr><tr><td>TDR Tags</td><td></td><td></td><td>Displays TDR Tags dialog box, where you can select which tags to display on the selected plot. Available for 2D and 3D plots only.</td></tr><tr><td>Dataset Information</td><td></td><td></td><td>Displays Dataset Information dialog box, where you can access 2D or 3D dataset information, such as the number of points or elements in a specific material or region. Available for 2D and 3D plots only.</td></tr></table>

# Window Menu

Table 24 Window menu   

<table><tr><td>Command</td><td>Button</td><td>Shortcut keys</td><td>Description</td></tr><tr><td>Tile Grid</td><td></td><td></td><td>Organizes loaded plots into a grid.</td></tr><tr><td>Tile Vertically</td><td></td><td></td><td>Organizes loaded plots vertically in the plot area.</td></tr><tr><td>Tile Horizontally</td><td></td><td></td><td>Organizes loaded plots horizontally in the plot area.</td></tr><tr><td>Set Default State</td><td></td><td></td><td>Restores the toolbars and workspace to their default positions in the user interface.</td></tr><tr><td>Manage Frames</td><td></td><td></td><td>Displays the Manage Frames dialog box.</td></tr><tr><td>Previous Plot</td><td>&lt; img src=""&gt;</td><td>Page Up key</td><td>Moves to the previous loaded plot.</td></tr><tr><td>Next Plot</td><td>&lt; img src=""&gt;</td><td>Page Down key</td><td>Moves to the next loaded plot.</td></tr><tr><td>Minimize Plot</td><td>&lt; img src=""&gt;</td><td></td><td>Minimizes the selected plot.</td></tr><tr><td>Maximize</td><td>&lt; img src=""&gt;</td><td>F10 key</td><td>Maximizes the selected plot.</td></tr><tr><td>Full Plot View</td><td></td><td>F12 key</td><td>Hides the toolbars and zooms into a plot using the entire workspace.</td></tr><tr><td>Restore All Plots</td><td></td><td></td><td>Restores all minimized plots.</td></tr><tr><td>Plots</td><td></td><td></td><td>Lists the open plots.</td></tr></table>

# Help Menu

Table 25 Help menu   

<table><tr><td>Command</td><td>Button</td><td>Shortcut keys</td><td>Description</td></tr><tr><td>User Guide</td><td></td><td></td><td>Opens PDF file of SentsaurusTM Visual User Guide.</td></tr><tr><td>Python API Reference</td><td></td><td></td><td>Opens the API that documents the Python commands available in Sentsaurus Visual.</td></tr><tr><td>Tutorial</td><td></td><td></td><td>Opens Sentsaurus Visual module of TCAD Sentsaurus Tutorial (HTML).</td></tr><tr><td>About</td><td></td><td>Ctrl+B</td><td>Shows information about Sentsaurus Visual.</td></tr></table>

# Note:

The default viewer for the PDF file of the Sentaurus™ Visual User Guide is Adobe® Reader®. Using another PDF viewer might deactivate some cross-references or external links in the PDF file.

# Toolbars

This section describes the different toolbars.

# File Toolbar

Table 26 File toolbar   

<table><tr><td>Button</td><td>Description</td><td>Button</td><td>Description</td></tr><tr><td></td><td>Open</td><td></td><td>Export Plot</td></tr><tr><td></td><td>Reload All</td><td></td><td>Run Script</td></tr><tr><td></td><td>Reload Selected</td><td></td><td>Print Plots</td></tr></table>

# Edit Toolbar

Table 27 Edit toolbar   

<table><tr><td>Button</td><td>Description</td><td>Button</td><td>Description</td></tr><tr><td colspan="2">Undo</td><td>/</td><td>Draw
(xy and 2D plots only)</td></tr></table>

# Draw Toolbar

Table 28 Draw toolbar (available for xy and 2D plots only)   

<table><tr><td>Button</td><td>Description</td><td>Button</td><td>Description</td></tr><tr><td>/</td><td>Draw Line</td><td>○</td><td>Draw Ellipse</td></tr><tr><td>□</td><td>Draw Rectangle</td><td>IT</td><td>Insert Text</td></tr></table>

# View Toolbar

Table 29 View toolbar   

<table><tr><td>Button</td><td>Description</td><td>Button</td><td>Description</td></tr><tr><td></td><td>Select
Select/Rotate (3D plots only)</td><td></td><td>Rotation Axis X (3D plots only)</td></tr><tr><td></td><td>Reset</td><td></td><td>Rotation Axis Y (3D plots only)</td></tr><tr><td></td><td>Zoom</td><td></td><td>Rotation Axis Z (3D plots only)</td></tr><tr><td></td><td>Best Look (xy plots only)</td><td></td><td>View Plane XY (3D plots only)</td></tr><tr><td>logX</td><td>Log Scale X (xy plots only)</td><td>YZ</td><td>View Plane YZ (3D plots only)</td></tr><tr><td>logY</td><td>Log Scale Y (xy plots only)</td><td>XZ</td><td>View Plane XZ (3D plots only)</td></tr><tr><td>logY2</td><td>Log Scale Y Right (xy plots only)</td><td></td><td>Fast Draw (3D plots only)</td></tr><tr><td></td><td>Spherical Rotation (3D plots only)</td><td></td><td></td></tr></table>

# Tools Toolbar

Table 30 Tools toolbar   

<table><tr><td>Button</td><td>Description</td><td>Button</td><td>Description</td></tr><tr><td></td><td>Link</td><td>X</td><td>Cut X (2D and 3D plots only)</td></tr><tr><td></td><td>Special Link</td><td>Y</td><td>Cut Y (2D and 3D plots only)</td></tr><tr><td></td><td>Curve Properties (xy plots only)</td><td>Z</td><td>Cut Z (2D and 3D plots only)</td></tr><tr><td></td><td>Region Properties (2D and 3D plots only)</td><td>1 2</td><td>Ruler (2D and 3D plots only)</td></tr><tr><td></td><td>Probe</td><td></td><td>Value Blanking (3D plots only)</td></tr><tr><td></td><td>Analysis (xy plots only)</td><td></td><td>Streamlines (2D and 3D plots only)</td></tr><tr><td></td><td>Plot Band Diagram (xy plots only)</td><td></td><td>Overlay (2D and 3D plots only)</td></tr><tr><td></td><td>Precision Cuts (2D and 3D plots only)</td><td></td><td>Diff Plots (2D and 3D plots only)</td></tr><tr><td></td><td>Outline (2D plots only)</td><td>∫dr</td><td>Integrate (2D and 3D plots only)</td></tr></table>

# Movies Toolbar

Table 31 Movies toolbar   

<table><tr><td>Button</td><td>Description</td><td>Button</td><td>Description</td></tr><tr><td></td><td>Start Recording</td><td></td><td>Add Frames</td></tr><tr><td></td><td>Stop Recording</td><td></td><td></td></tr></table>

# Look Toolbar

Table 32 Look toolbar   

<table><tr><td>Button</td><td>Description</td><td>Button</td><td>Description</td></tr><tr><td></td><td>Change Panel View
(Changes presentation of left pane from separate tabs to one view)</td><td>Tcl</td><td>Tcl Console
(Shows or hides Tcl Console)</td></tr><tr><td></td><td>Properties Panel
(Shows or hides properties panel for whichever plot is selected)</td><td>Py</td><td>Python Console
(Shows or hides Python Console)</td></tr><tr><td>Data</td><td>Data Selection Panel(Shows or hides Data Selection panel)</td><td></td><td></td></tr></table>

# Additional Keyboard Shortcuts (2D and 3D Plots)

Table 33 Additional keyboard shortcuts for 2D and 3D plots   

<table><tr><td>Action</td><td>Shortcut keys</td><td>Description</td></tr><tr><td>Basic rotation</td><td>Press the N key while dragging the cursor</td><td>Enables rollerball rotation until you release the N key (applies to 3D plots only).</td></tr><tr><td>Rotate around x-axis</td><td>Press the X key while dragging the cursor</td><td>Enables rotation around the x-axis until you release the X key (applies to 3D plots only).</td></tr><tr><td>Rotate around y-axis</td><td>Press the Y key while dragging the cursor</td><td>Enables rotation around the y-axis until you release the Y key (applies to 3D plots only).</td></tr><tr><td>Rotate around z-axis</td><td>Press the Z key while dragging the cursor</td><td>Enables rotation around the z-axis until you release the Z key (applies to 3D plots only).</td></tr><tr><td>Spherical rotation</td><td>Press the S key while dragging the cursor</td><td>Enables spherical rotation until you release the S key (applies to 3D plots only).</td></tr><tr><td>Change rotation center point</td><td>Press O key</td><td>Updates the rotation point of the structure. A new point will be placed at the cursor position.</td></tr><tr><td>Switch on or off 3D guide axis</td><td>Press I key</td><td>Switches on or off the 3D guide axis. However, to see this change, a minor rotation is required.</td></tr><tr><td>Enable zoom navigation</td><td>Press Ctrl+Shift while dragging the cursor</td><td>Enables zoom navigation (equivalent to clicking and dragging the middle mouse button).</td></tr><tr><td>Zoom to cursor position</td><td>Press F key</td><td>When you place the cursor somewhere on the structure (you do not click) and then press the F key, the structure changes view so that the new center of the plot is where the cursor was placed.</td></tr><tr><td>Highlight material or region menu</td><td>Double-click</td><td>Highlights the region or material in blue in the Data Selection panel.</td></tr><tr><td>Highlight region</td><td>Press P key</td><td>Highlights the selected region using a red box. To cancel this operation, press the P key when the cursor is not positioned over any region.</td></tr><tr><td>Reset view</td><td>Press R key</td><td>Returns the structure to the default view.</td></tr><tr><td>Enable wireframe view</td><td>Press W key</td><td>Changes the display of the structure to a mesh view.</td></tr><tr><td>Enable solid view</td><td>Press S key</td><td>Changes the display of the structure to a non-mesh view.</td></tr></table>

# D

# DAvailable Formulas

This appendix presents an overview of the functions available in Sentaurus Visual as well as the syntax of the formulas used to create curves, variables, and fields.

# Creating a New Variable

# Note:

For new variables, variables of an existing dataset can be used in the function specification or a list of values.

To create a new variable, use the create_variable command. For example, to create the common logarithm of the variable Y present in the dataset myDataset as a new variable, you can use the command:

create_variable -name commonLogY -dataset "myDataset" -function "log(<Y:myDataset>)"

To access variables on functions, use the format <VARIABLE:DATASET>. This new variable will appear in the variables list of the dataset in which it was created.

# Note:

Variables can be created on the Data tab of the Data Selection panel by clicking New Variable. A dialog box is displayed where you can interactively add functions, operators, and variables to create a new formula.

# Creating a New Curve

# Note:

For new curves, existing curves can be used in the function specification.

To create a new curve, use the create_curve command. For example, to create the derivative of Curve_1 and name it newCurve, you can use the command:

create_curve -name newCurve -function diff(<Curve_1>)

To use the curves on formulas, you must write the curve identifier in angle brackets. For example, to use the data on Curve_1 for the differentiation function, it is written as <Curve_1>.

# Note:

If you want to create a new curve from more than one curve using a function. For example:

create_curve -name newCurve_2 -function <Curve_1>*<Curve_2>

both curves Curve_1 and Curve_2 must share the same x-axis and must have the same amount of valid data. Otherwise, this could lead to unexpected results.

Curves can be created on the Curves tab of the Data Selection panel by clicking the New button. A dialog box is displayed where you can interactively add functions, operators, and curves to create a new curve based on a formula.

# Applying Functions to a Curve

To apply a function to an existing curve, use the set_curve_prop command. For example, to apply the absolute value function to Curve_1, use the command:

set_curve_prop Curve_1 -function "abs"

Alternatively, you can use the Curve Properties panel:

1. Select the curve.   
2. Click the Trans. tab.   
3. From the Function list, select the required function.

# Note:

It is not possible to apply more than one function to an existing curve. Instead, it is recommended to create a new curve.

Furthermore, as an exception, you can apply the integral, or a first-derivative or second-derivative function in addition to the other function, using the same command, but with another parameter (-integ or -deriv):

```tcl
set Curve_prop Curve_1 -integ  
set Curve_prop Curve_1 -deriv 2 
```

Alternatively, you can use the Curve Properties panel:

1. Select the curve.   
2. Click the Trans. tab.   
3. From the Deriv / Integ list, select the function to apply.

# Creating a New Field

# Note:

For new fields, existing fields can be used in the function specification.

To create a new field, use the create_field command. Existing fields are used to create new fields based on functions and operations specified by the user. In the following example, consider two fields called ElectricField-X and ElectricField-Y. You want to create a new field that contains the absolute value of the sum of both fields. This can be done with the following command:

```powershell
create_field -name AbsSumElectricField -dataset 2D
		-function "abs(<ElectricField-X>+<ElectricField-Y>") " -show 
```

# Note:

New fields also can be created on the More tab of the Data Selection panel by clicking Add Field.

# Available Functions

Table 34 on page 408 lists the available functions. The function arguments are:

• Double: Numeric values, scalar field names.   
• Vector: Vector field names.   
• Curve: 1D curve names.

# For example:

```txt
-function "sin(<ElectricField-X> + <ElectricField-Y>") (Double or Scalar)  
-function "sin(<ElectricField-V>") (Vector)  
-function "sin(<Curve_1>") (Curve) 
```

# Note:

For functions that only return a Double value and are used as the outer function in formulas, the result will be displayed only in a dialog box and cannot be used in Tcl scripts.

Table 34 Available functions   

<table><tr><td>Function</td><td>Arguments</td><td>Returns</td><td>Description</td></tr><tr><td rowspan="3">abs(x)</td><td>Double</td><td>Double</td><td>Absolute value</td></tr><tr><td>Vector</td><td>Vector</td><td></td></tr><tr><td>Curve</td><td>Curve</td><td></td></tr><tr><td rowspan="3">acos(x)</td><td>Double</td><td>Double</td><td>ArcCosine</td></tr><tr><td>Vector</td><td>Vector</td><td></td></tr><tr><td>Curve</td><td>Curve</td><td></td></tr><tr><td rowspan="3">acosh(x)</td><td>Double</td><td>Double</td><td>Hyperbolic ArcCosine</td></tr><tr><td>Vector</td><td>Vector</td><td></td></tr><tr><td>Curve</td><td>Curve</td><td></td></tr><tr><td rowspan="3">asin(x)</td><td>Double</td><td>Double</td><td>ArcSine</td></tr><tr><td>Vector</td><td>Vector</td><td></td></tr><tr><td>Curve</td><td>Curve</td><td></td></tr><tr><td rowspan="3">asinh(x)</td><td>Double</td><td>Double</td><td>Hyperbolic ArcSine</td></tr><tr><td>Vector</td><td>Vector</td><td></td></tr><tr><td>Curve</td><td>Curve</td><td></td></tr><tr><td rowspan="3">atan(x)</td><td>Double</td><td>Double</td><td>ArcTangent</td></tr><tr><td>Vector</td><td>Vector</td><td></td></tr><tr><td>Curve</td><td>Curve</td><td></td></tr><tr><td rowspan="3">atanh(x)</td><td>Double</td><td>Double</td><td>Hyperbolic ArcTangent</td></tr><tr><td>Vector</td><td>Vector</td><td></td></tr><tr><td>Curve</td><td>Curve</td><td></td></tr><tr><td rowspan="3">bessel_j0(x)</td><td>Double</td><td>Double</td><td>Bessel function of first kind, order zero</td></tr><tr><td>Vector</td><td>Vector</td><td></td></tr><tr><td>Curve</td><td>Curve</td><td></td></tr><tr><td rowspan="3">bessel_j1(x)</td><td>Double</td><td>Double</td><td>Bessel function of first kind, first order</td></tr><tr><td>Vector</td><td>Vector</td><td></td></tr><tr><td>Curve</td><td>Curve</td><td></td></tr><tr><td rowspan="3">bessel_y0(x)</td><td>Double</td><td>Double</td><td>Bessel function of second kind, order zero</td></tr><tr><td>Vector</td><td>Vector</td><td></td></tr><tr><td>Curve</td><td>Curve</td><td></td></tr><tr><td rowspan="3">bessel_y1(x)</td><td>Double</td><td>Double</td><td rowspan="3">Bessel function of second kind, first order</td></tr><tr><td>Vector</td><td>Vector</td></tr><tr><td>Curve</td><td>Curve</td></tr><tr><td rowspan="3">cbrt(x)</td><td>Double</td><td>Double</td><td rowspan="3">Cube root of x</td></tr><tr><td>Vector</td><td>Vector</td></tr><tr><td>Curve</td><td>Curve</td></tr><tr><td rowspan="3">ceil(x)</td><td>Double</td><td>Double</td><td rowspan="3">Approximates to the next integer</td></tr><tr><td>Vector</td><td>Vector</td></tr><tr><td>Curve</td><td>Curve</td></tr><tr><td rowspan="2">cfftim(x,y)</td><td>x: Vector, Curve</td><td>Vector</td><td rowspan="2">Fast Fourier transform, imaginary value</td></tr><tr><td>y: Vector, Curve</td><td>Curve</td></tr><tr><td rowspan="2">cfftre(x,y)</td><td>x: Vector, Curve</td><td>Vector</td><td rowspan="2">Fast Fourier transform, real value</td></tr><tr><td>y: Vector, Curve</td><td>Curve</td></tr><tr><td rowspan="2">ciftim(x,y)</td><td>x: Vector, Curve</td><td>Vector</td><td rowspan="2">Inverse fast Fourier transform, imaginary value</td></tr><tr><td>y: Vector, Curve</td><td>Curve</td></tr><tr><td rowspan="2">cifftre(x,y)</td><td>x: Vector, Curve</td><td>Vector</td><td rowspan="2">Inverse Fourier transform, real value</td></tr><tr><td>y: Vector, Curve</td><td>Curve</td></tr><tr><td rowspan="3">cos(x)</td><td>Double</td><td>Double</td><td rowspan="3">Cosine</td></tr><tr><td>Vector</td><td>Vector</td></tr><tr><td>Curve</td><td>Curve</td></tr><tr><td rowspan="3">cosh(x)</td><td>Double</td><td>Double</td><td rowspan="3">Hyperbolic cosine</td></tr><tr><td>Vector</td><td>Vector</td></tr><tr><td>Curve</td><td>Curve</td></tr><tr><td>crop(y, x, min, max)</td><td>x: Vector</td><td>Vector</td><td rowspan="5">Crops the values depending of the minimum and maximum range of x</td></tr><tr><td rowspan="4">crop(c, min, max)</td><td>y: Vector</td><td>Curve</td></tr><tr><td>min: Double</td><td></td></tr><tr><td>max: Double</td><td></td></tr><tr><td>c: Curve</td><td></td></tr><tr><td>diff(c)</td><td>x: Vector</td><td>Vector</td><td rowspan="3">First-order derivative</td></tr><tr><td rowspan="2">diff(y,x)</td><td>y: Vector</td><td>Curve</td></tr><tr><td>c: Curve</td><td></td></tr><tr><td rowspan="3">erf(x)</td><td>Double</td><td>Double</td><td>Error function</td></tr><tr><td>Vector</td><td>Vector</td><td></td></tr><tr><td>Curve</td><td>Curve</td><td></td></tr><tr><td rowspan="3">erfc(x)</td><td>Double</td><td>Double</td><td>Complementary error function</td></tr><tr><td>Vector</td><td>Vector</td><td></td></tr><tr><td>Curve</td><td>Curve</td><td></td></tr><tr><td rowspan="3">exp(x)</td><td>Double</td><td>Double</td><td>Evaluates e(x)</td></tr><tr><td>Vector</td><td>Vector</td><td></td></tr><tr><td>Curve</td><td>Curve</td><td></td></tr><tr><td rowspan="2">fftabs(y,x)</td><td>x: Vector, Curve</td><td>Vector</td><td rowspan="2">Fast Fourier transform, absolute value</td></tr><tr><td>y: Vector, Curve</td><td>Curve</td></tr><tr><td rowspan="2">fftim(x)</td><td>Vector</td><td>Vector</td><td rowspan="2">Fast Fourier transform, imaginary value</td></tr><tr><td>Curve</td><td>Curve</td></tr><tr><td rowspan="2">fftre(x)</td><td>Vector</td><td>Vector</td><td>Fast Fourier transform, real value</td></tr><tr><td>Curve</td><td>Curve</td><td></td></tr><tr><td rowspan="3">floor(x)</td><td>Double</td><td>Double</td><td>Approximates to the previous integer</td></tr><tr><td>Vector</td><td>Vector</td><td></td></tr><tr><td>Curve</td><td>Curve</td><td></td></tr><tr><td rowspan="3">gamma(x)</td><td>Double</td><td>Double</td><td>Gamma function</td></tr><tr><td>Vector</td><td>Vector</td><td></td></tr><tr><td>Curve</td><td>Curve</td><td></td></tr><tr><td rowspan="2">ifftim(x)</td><td>Vector</td><td>Vector</td><td>Inverse Fourier transform, imaginary value</td></tr><tr><td>Curve</td><td>Curve</td><td></td></tr><tr><td rowspan="2">ifftre(x)</td><td>Vector</td><td>Vector</td><td>Inverse Fourier transform, real value</td></tr><tr><td>Curve</td><td>Curve</td><td></td></tr><tr><td>integr(y,x)</td><td>y: Vector</td><td>Vector</td><td>Integrates the vector y over the range specified by x, or integrates the curve c</td></tr><tr><td rowspan="2">integr(c)</td><td>x: Vector</td><td>Curve</td><td></td></tr><tr><td>c: Curve</td><td></td><td></td></tr><tr><td rowspan="3">inverse(x)</td><td>Double</td><td>Double</td><td>Inverse value</td></tr><tr><td>Vector</td><td>Vector</td><td></td></tr><tr><td>Curve</td><td>Curve</td><td></td></tr><tr><td rowspan="3">lgamma(x)</td><td>Double</td><td>Double</td><td>Logarithmic gamma function</td></tr><tr><td>Vector</td><td>Vector</td><td></td></tr><tr><td>Curve</td><td>Curve</td><td></td></tr><tr><td rowspan="3">log(x)</td><td>Double</td><td>Double</td><td>Natural logarithm</td></tr><tr><td>Vector</td><td>Vector</td><td></td></tr><tr><td>Curve</td><td>Curve</td><td></td></tr><tr><td rowspan="3">log10(x)</td><td>Double</td><td>Double</td><td>Common logarithm</td></tr><tr><td>Vector</td><td>Vector</td><td></td></tr><tr><td>Curve</td><td>Curve</td><td></td></tr><tr><td>minmax(x, min, max)</td><td>x: Vector min: Double max: Double</td><td>Vector</td><td>All values that are less than min are replaced with min, and all values greater than max are replaced with max</td></tr><tr><td rowspan="4">pow(x,y)</td><td>x: Double</td><td>Double</td><td>Evaluates xy, where x is a double value, a vector of values, or a curve</td></tr><tr><td>x: Vector</td><td>Vector</td><td></td></tr><tr><td>x: Curve</td><td>Curve</td><td></td></tr><tr><td>y: Double</td><td></td><td></td></tr><tr><td rowspan="4">rms(x,y)</td><td>x: Vector</td><td>Double</td><td>Root mean square value</td></tr><tr><td>x: Curve</td><td></td><td></td></tr><tr><td>y: Vector</td><td></td><td></td></tr><tr><td>y: Curve</td><td></td><td></td></tr><tr><td rowspan="3">sign(x)</td><td>Double</td><td>Double</td><td>Sign</td></tr><tr><td>Vector</td><td>Vector</td><td></td></tr><tr><td>Curve</td><td>Curve</td><td></td></tr><tr><td rowspan="3">sin(x)</td><td>Double</td><td>Double</td><td>Sine</td></tr><tr><td>Vector</td><td>Vector</td><td></td></tr><tr><td>Curve</td><td>Curve</td><td></td></tr><tr><td rowspan="3">sinh(x)</td><td>Double</td><td>Double</td><td>Hyperbolic sine</td></tr><tr><td>Vector</td><td>Vector</td><td></td></tr><tr><td>Curve</td><td>Curve</td><td></td></tr><tr><td rowspan="3">sqrt(x)</td><td>Double</td><td>Double</td><td>Square root</td></tr><tr><td>Vector</td><td>Vector</td><td></td></tr><tr><td>Curve</td><td>Curve</td><td></td></tr><tr><td rowspan="3">tan(x)</td><td>Double</td><td>Double</td><td>Tangent</td></tr><tr><td>Vector</td><td>Vector</td><td></td></tr><tr><td>Curve</td><td>Curve</td><td></td></tr><tr><td>tangent(c, v)</td><td>x: Vector</td><td>Vector</td><td>Creates a tangent line in the point v</td></tr><tr><td rowspan="3">tangent(y, x, v)</td><td>y: Vector</td><td>Curve</td><td>on the curve c, or the curve defined by the vectors x and y</td></tr><tr><td>c: Curve</td><td></td><td></td></tr><tr><td>v: Double</td><td></td><td></td></tr><tr><td rowspan="3">tanh(x)</td><td>Double</td><td>Double</td><td>Hyperbolic tangent</td></tr><tr><td>Vector</td><td>Vector</td><td></td></tr><tr><td>Curve</td><td>Curve</td><td></td></tr><tr><td rowspan="2">vecmax(x)</td><td>x: Vector</td><td>Double</td><td>Returns the maximum y-value of a curve, or the maximum value of a vector</td></tr><tr><td>c: Curve</td><td></td><td></td></tr><tr><td>vecmax(c)</td><td></td><td></td><td></td></tr><tr><td rowspan="2">vecmin(x)</td><td>x: Vector</td><td>Double</td><td>Returns the minimum y-value of a curve, or the minimum value of a vector</td></tr><tr><td>c: Curve</td><td></td><td></td></tr><tr><td>vecmin(c)</td><td></td><td></td><td></td></tr><tr><td rowspan="4">vecvalx(y, x, v)</td><td>x: Vector</td><td>Double</td><td>Returns the x-value when y=v of a curve</td></tr><tr><td>y: Vector</td><td></td><td></td></tr><tr><td>c: Curve</td><td></td><td></td></tr><tr><td>v: Double</td><td></td><td></td></tr><tr><td rowspan="4">vecvaly(y, x, v)</td><td>x: Vector</td><td>Double</td><td>Returns the y-value when x=v of a curve</td></tr><tr><td>y: Vector</td><td></td><td></td></tr><tr><td>c: Curve</td><td></td><td></td></tr><tr><td>v: Double</td><td></td><td></td></tr><tr><td>veczero(y, x)</td><td>x: Vector</td><td>Double</td><td>Returns the x-value when y=0 of a curve</td></tr><tr><td rowspan="2">veczero(c)</td><td>y: Vector</td><td></td><td></td></tr><tr><td>c: Curve</td><td></td><td></td></tr></table>

# E

# EInspect Support in Sentaurus Visual

This appendix provides information about the level of support for running Inspect scripts in Sentaurus Visual.

The support of Inspect commands is available only if the commands are in a script file and it is loaded using one of the following options:

From the command line, for example, pass an Inspect script file as an argument with the corresponding option:

svisual -inspect test_ins.cmd

From the user interface, choose File $>$ Run Script. In the Open Script File dialog box, select Inspect Command File (*.cmd) in the Files of type field.   
• Load a Tcl script using the load_script_file Tcl command. For example:

load_script_file test_ins.cmd -inspect

# Fully Supported Commands

Sentaurus Visual fully supports the following Inspect commands:

```txt
cv_abs cv_compute cv_create cv_createDS  
cv_createFromScript cv_createWithFormula cv_delete cv_display  
cv_getVals cv_getValsX cv_getValsY cv_getXaxis  
cv_getYaxis cv_getZero cv_lineColor cv_lineStyle  
cv_log10Scale cv_logScale cv_printVals cv_split  
cv_split_disc  
f_Gamma f_gm f_IDSS f_KP 
```

```txt
f_Ron f_Rout f_TetaG f_VT  
ftscalarg_r_createLabel gr_formatAxis grmappedAxis gr_precision  
gr_setGridAttr gr_setLegend gr_setLegendPos  
load.library macro_defined  
projGetDataSet proj_getList proj_getNodeList proj_load  
proj unload  
script_exit script_sleep 
```

# Partially Supported Commands

Sentaurus Visual only partially supports the Inspect commands listed in Table 35.

Table 35 Partially supported Inspect commands   

<table><tr><td>Command</td><td>Limitations</td></tr><tr><td>cv_renameCurve</td><td>Works only if the curve is not displayed.</td></tr><tr><td>cv_set_interpol</td><td>Works only if the curve is displayed.</td></tr><tr><td>cv_setCurveAttr</td><td>Cannot set color and width of the marker outline.
Cannot set the fill color of the marker.
Triangle marker is not available.</td></tr><tr><td>gr_setAxisAttr</td><td>Cannot set color and width of the axis line.
Cannot set number of secondary ticks and angle at which the tick labels are drawn.</td></tr><tr><td>gr_setGeneralAttr</td><td>Only background color can be set.</td></tr><tr><td>gr_setLegendAttr</td><td>Cannot set frame color, width position, and anchor.</td></tr><tr><td>gr_setTitleAttr</td><td>Cannot set title justification.</td></tr><tr><td>script_break</td><td>Suspend the script, displaying a message.</td></tr></table>

# Not Supported Commands

Sentaurus Visual does not support the following Inspect commands:

```tcl
cv_delPts cv_inv cv_reset cv_write fhideInternalCurves f_showInternalCurves f_VT1 f_VT2 fi_writeBitmap fi_writeEps fi_writePs  
gb_setpreferences gr_deleteLabel graph_load graph_write  
param_load param_write proj_write 
```

# Script Library Support

This section explains the support Sentaurus Visual provides for different Inspect script libraries.

# Extraction Library

All the commands from this library are fully supported only if they are calculated over displayed curves:

```txt
ExtractEarlyV ExtractGm ExtractGmb ExtractIoff   
ExtractMax ExtractRon ExtractSS ExtractValue   
ExtractVtgm ExtractVtgmb ExtractVti 
```

If the curve is created but not displayed, the result will be the same for all commands except ExtractIoff because the interpolation will be linear not logarithmic.

# Curve Comparison Library

Both commands generate a new curve with specific visual properties of the marker, which are not necessarily the same as in Inspect, that is, there is a visual difference:

• cvcmp_CompareTwoCurves   
• cvcmp_DeltaTwoCurves

# The extend Library

Sentaurus Visual only partially supports the commands listed in Table 36.

Table 36 Partially supported commands of extend library   

<table><tr><td>Command</td><td>Limitations</td></tr><tr><td>cv_autocrStyle</td><td rowspan="2">Depends on cv_setCurveAttr, which is not fully supported. For details about the limitations of cv_setCurveAttr, see Table 35 on page 414.</td></tr><tr><td>cv_disp</td></tr><tr><td>cv_nextSymbol</td><td rowspan="2">Triangle marker is not available.</td></tr><tr><td>cv_setSymbol</td></tr></table>

Sentaurus Visual does not support the following commands:

```txt
cv_exists cv_resetFillColor cv_setFillColor ds_getValue proj_check proj_datasetExists proj_getGroups proj_groupExists 
```

# F

# FExtraction Library

This appendix provides information about the procedures of the extraction library.

The procedures of the extraction library are used to extract various parameters from the I– V characteristics of various device types. The extraction library takes I–V data in the form of two Tcl lists: one list contains the voltages points and the other list contains the corresponding current values.

The extraction library is loaded automatically when Sentaurus Visual starts. However, if you have switched off the automatic loading of extension libraries, then you can load the extraction library explicitly with the command:

load_library extract

# Syntax Conventions

The extraction library uses a unique namespace identifier (ext::) for its procedures. All procedures and variables associated with this library are called with the namespace identifier prepended. For example:

ext::<proc_name>

Each procedure has several arguments. The extraction library uses an input parser that accepts arguments of the form:

-keyword <value>

# Note:

All Sentaurus Visual libraries support the standard Sentaurus Visual syntax in which keywords are preceded by a dash. For backward compatibility, all Sentaurus Visual libraries continue to support the keyword $=$ <value> syntax as well. For each procedure call, you can use either the -keyword <value> syntax or the keyword $\ l =$ <value> syntax. However, within any one procedure call, only one type of syntax can be used. Otherwise, an error message will be generated. Only the new syntax is documented. If you want to continue using the

# Appendix F: Extraction Library

Syntax Conventions

keyword ${ . } =$ <value> syntax, you also can insert space between the keyword and the equal sign, for example, keyword $=$ <value>. Omitting the space between the equal sign and the value field will result in a failure if the value is a de-referenced Tcl variable. Use keyword $=$ $val (not keyword=$val).

The parser accepts arguments in any order. For some arguments, default values are predefined. Such arguments can be omitted. If arguments for which no defaults are predefined are omitted, the procedure will exit with an error message. In addition, unrecognized arguments result in an error message.

Instead of using the standard Tcl method of using the return value of the procedure to pass results back to the calling program, the extraction library uses a passing-by-reference method to return the results to the calling program. The procedure keyword -out is used to pass the results back to the calling program:

-out <var_name>, <list_name>, or <array_name>

The following conventions are used for the syntax of Tcl commands:

Angle brackets – <> – indicate text that must be replaced, but they are not part of the syntax. In particular, the following type identifiers are used:

◦ <r>: Replace with a real number, or a de-referenced Tcl variable that evaluates to a real number. For example: $val.   
◦ <i>: Replace with an integer, or a de-referenced Tcl variable that evaluates to an integer. For example: $\$ 1$ .   
◦ <string>: Replace with a string, or a de-referenced Tcl variable that evaluates to a string. For example: $file.   
◦ <list_of_r>: Replace with a list of real numbers, or a de-referenced Tcl variable that evaluates to a list of real numbers. For example: $values.   
◦ <list_of_strings>: Replace with a list of strings, or a de-referenced Tcl variable that evaluates to a list of strings. For example: $files.   
◦ <var_name>: Replace with the name of a local Tcl variable. For example: val (not $val).   
◦ <list_name>: Replace with the name of a local Tcl list. For example: values (not $values).   
◦ <array_name>: Replace with the name of a local Tcl array. For example: myarray (not $myarray).

• Brackets – [] – indicate that the argument is optional, but they are not part of the syntax.   
• A vertical bar – | – indicates options, only one of which can be specified.

# Help for Procedures

To request help on a specific procedure, in Tcl mode, set the -help keyword to 1:

ext::<procedure_name> -help 1

If this command is included in a Sentaurus Visual file, when Sentaurus Visual is executed in:

Batch mode in Sentaurus Workbench, the help information is printed to the runtime output file (with the extension .out) of the corresponding Sentaurus Visual node.   
Interactive mode in Sentaurus Workbench, the help information is displayed in the Tcl Console as well as printed in the Sentaurus Visual output file.

You also can enter the command in the Tcl Console of the user interface, in which case, the help information is displayed in the Console.

# Output of Procedures

As discussed in Syntax Conventions on page 417, all procedures of the extraction library pass the results back to the calling program by storing the results in a Tcl variable. The name of this Tcl variable is specified as the value of the -out keyword. All procedures beginning with ext::Extract extract a device parameter. For example, the procedure

ext::ExtractVtgm extracts the threshold voltage:

ext::ExtractVtgm -out Vt -name Vtgm -v $Vgs -i $absIds

Here, since -out Vt is used, the extracted threshold voltage is stored in the Tcl variable Vt.

All procedures of the extraction library beginning with ext::Extract pass the extracted value to the Sentaurus Workbench Family Tree (if the -name keyword differs from "noprint"). The extracted quantity is displayed as a Sentaurus Workbench variable.

If -name "noprint" is used, the extracted variable is not passed to the Sentaurus Workbench Family Tree. If -name out is used, the name of the variable specified by the -out keyword also is used as the name that appears in the Sentaurus Workbench Family Tree.

Here, since -name Vtgm is used, the extracted threshold voltage value is displayed as the Sentaurus Workbench variable Vtgm.

If there are errors in the extraction library procedures, the behavior of Sentaurus Visual depends on whether it is executed in batch mode or interactive mode in Sentaurus

# Appendix F: Extraction Library

# Output of Procedures

Workbench. In batch mode, Sentaurus Visual exits and an error message is printed only in the Sentaurus Visual error file (with the extension .err). In interactive mode, the error message is displayed in the Tcl Console as well as printed in the Sentaurus Visual error file. You can handle the errors raised by the procedures of the extraction library, for example, by using the Tcl catch command.

All procedures also print several messages (including warning messages). If Sentaurus Visual is executed in batch mode, the messages are printed only in the Sentaurus Visual output file; whereas, in interactive mode, the messages are displayed in the Tcl Console as well as printed in the Sentaurus Visual output file.

The amount of information printed depends on the information level specified by the procedure lib::SetInfoDef. Irrespective of the specified information level, the extracted value is printed in the output file by the procedures beginning with ext::Extract.

For example, if the information level is set to 0 for all procedures using the lib::SetInfoDef procedure:

lib::SetInfoDef 0ext::ExtractVtgm -out Vt -name Vtgm -v $Vgs -i $absIds

the following message is printed:

DOE: Vtgm 0.316

If the information level for the procedure ext::ExtractVtgm is set to 1 using the lib::SetInfoDef procedure:

lib::SetInfoDef 1ext::ExtractVtgm -out Vt -name Vtgm -v $Vgs -i $Ids -vo 1e-4

or by using the -info keyword:

lib::SetInfoDef 0ext::ExtractVtgm -out Vt -name Vtgm -v $Vgs -i $Ids -vo 1e-4 -info 1

the following message is printed:

DOE: Vtgm 0.316 Vtgm (Max gm method): 0.316

If the extraction library procedure cannot extract the parameter, the parameter is set to the character $\mathbf { \epsilon } ^ { 6 } \mathbf { x } ^ { 3 }$ and a message is printed. In the case of ext::ExtractVtgm, the following message is printed:

DOE: Vtgm x ext::ExtractVtgm: Vtgm not found!

# ext::AbsList

Computes the absolute value of all elements of a list.

# Syntax

```rust
ext::AbsList -out <list_name> -x <list_of_r> [-info 0 | 1 | 2 | 3] [-help 0 | 1] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-out</td><td>Name of a list to store the list of absolute values. (List name, no default)</td></tr><tr><td>-x</td><td>Input list. (List of real numbers, no default)</td></tr><tr><td>-info 0 | 1 | 2 | 3</td><td>Sets local information level. Default: 0</td></tr><tr><td>-help 0 | 1</td><td>Prints a help screen if set to 1. Default: 0</td></tr></table>

# Returns

None.

# Example

```tcl
load_file DATA/IdvGLin_pMOS_des.plt -name DC
setIds [get_variable_data "drain TotalCurrent" -dataset DC]
puts "Ids: $Ids" 
```

```txt
# Compute absolute value of drain currents
ext::AbsList -out Idabs -x $Ids
puts "Idabs: $Idabs" 
```

```txt
--->Ids: -5.40e-10 -9.56e-10 -9.11723e-08 ... -6.73e-05
Idabs: 5.40e-10 9.56e-10 9.11723e-08 ... 6.73e-05 
```

# ext::DiffForwardList

Computes the first-order derivative of a curve using the forward finite difference method. The curve is represented by two Tcl lists: one contains the x-values (independent variable) and one contains the corresponding y-values (dependent variable).

# Syntax

```rust
ext::DiffForwardList -out <array_name> -x <list_of_r> -y <list_of_r> [-info 0 | 1 | 2 | 3] [-help 0 | 1] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-out</td><td>Name of an array to store the results. The array has one string-valued index. The index contains the elements x and dy. The values of the x element and the dy element are lists of x-values and first-order derivatives, respectively. (Array name, no default)</td></tr><tr><td>-x</td><td>List containing the x-values (independent variable). (List of real numbers, no default)</td></tr><tr><td>-y</td><td>List containing the y-values (dependent variable). (List of real numbers, no default)</td></tr><tr><td>-info 0 | 1 | 2 | 3</td><td>Sets local information level. Default: 0</td></tr><tr><td>-help 0 | 1</td><td>Prints a help screen if set to 1. Default: 0</td></tr></table>

# Returns

None.

# Example

```tcl
set Xs [list 1.0 2.0 3.0 4.0]
# Generate Ys using y=2*x
set Ys [list]
foreach x $Xs {
    lappend Ys [expr 2*$x]
}
ext::DiffForwardList -out DyDx -x $Xs -y $Ys
puts "x-values: $Xs"
puts "xnew-values: $DyDx(x)"
puts "y-values: $Ys"
puts "derivative: $DyDx(dy)" 
```

```yaml
#-> x-values: 1.0 2.0 3.0 4.0
#-> xnew-values: 1.5 2.5 3.5
#-> y-values: = 2.0 4.0 6.0 8.0
#-> derivative: 2.0 2.0 2.0 
```

# ext::DiffList

Computes the first-order derivative of a curve. The curve is represented by two Tcl lists: one contains the x-values (independent variable) and one contains the corresponding y-values (dependent variable).

# Note:

The procedure ext::DiffList uses the central finite difference method to compute the derivative at a data point. This method uses the x- and y-values of two adjacent points, which are computed internally by the procedure using either linear or logarithmic interpolation.

# Syntax

```rust
ext::DiffList -out <list_name> -x <list_of_r> -y <list_of_r> [-yLog 0 | 1] [-xLog 0 | 1] [-info 0 | 1 | 2 | 3] [-help 0 | 1] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-out</td><td>Name of a list to store the first-order derivative. (List name, no default)</td></tr><tr><td>-x</td><td>List containing the x-values (independent variable). (List of real numbers, no default)</td></tr><tr><td>-y</td><td>List containing the y-values (dependent variable). (List of real numbers, no default)</td></tr><tr><td>-yLog 0 | 1</td><td>Selects linear (0) or logarithmic (1) interpolation for y-axis values for computing the derivative. Default: 0</td></tr><tr><td>-xLog 0 | 1</td><td>Selects linear (0) or logarithmic (1) interpolation for x-axis values for computing the derivative. Default: 0</td></tr><tr><td>-info 0 | 1 | 2 | 3</td><td>Sets local information level. Default: 0</td></tr><tr><td>-help 0 | 1</td><td>Prints a help screen if set to 1. Default: 0</td></tr></table>

# Returns

None.

# Example

```tcl
set Xs [list 1 1.5 2.5 6 7 7.5 8.5 8.7 8.8 10]
# Generate Ys using y=exp(x)+1
set Ys [list]
foreach x $Xs {
    lappend Ys [expr exp($x) + 1]
}
# For exponential function, use logarithmic interpolation
# for y-axis values
set yLog 1
ext::DiffList -out dydx -x $Xs -y $Ys -yLog $yLog
puts "x-values: $Xs"
puts "y-values: $Ys"
puts "derivative: $dydx"
#-> x-values: 1 1.5 2.5 6 7 7.5 8.5 8.7 8.8 10
#-> y-values: 3.718 5.481 13.182 ... 22027.465
#-> derivative: 2.887 4.532 12.231 ... 22012.323 
```

# ext::ExtractBVi

Extracts the breakdown voltage from an I–V curve. The breakdown voltage is defined as the bias voltage at which the current reaches a certain level. The curve is represented by two Tcl lists: one contains the voltage points and one contains the corresponding current values.

# Syntax

```rust
ext::ExtractBVi -out <var_name> -v <list_of_r> -i <list_of_r> -io <r> [-name <string>] [-f <string>] [-info 0 | 1 | 2 | 3] [-help 0 | 1] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-out</td><td>Variable name to store the value of the breakdown voltage. (Real number, no default)</td></tr><tr><td>-v</td><td>List containing the voltage values. (List of real numbers, no default)</td></tr><tr><td>-i</td><td>List containing the current values. (List of real numbers, no default)</td></tr><tr><td>-o</td><td>Current level. (Nonzero real number, no default)</td></tr><tr><td>-name &lt;string&gt;</td><td>Name of the extracted variable to appear in the Sentaurus Workbench Family Tree.</td></tr><tr><td></td><td>Note:</td></tr><tr><td></td><td>If -name "noprint" is used, Sentaurus Workbench extraction is suppressed.</td></tr><tr><td></td><td>If -name "out" is used, the name of the variable specified by the -out keyword also is used as the name that appears in the Sentaurus Workbench Family Tree.</td></tr><tr><td></td><td>(String, default: "BVi")</td></tr><tr><td>-f &lt;string&gt;</td><td>Format string used to write the extracted variable to the Sentaurus Workbench Family Tree. (String, default: "%.3e")</td></tr><tr><td>-info 0 | 1 | 2 | 3</td><td>Sets local information level. Default: 0</td></tr><tr><td>-help 0 | 1</td><td>Prints a help screen if set to 1. Default: 0</td></tr></table>

# Returns

None.

# Example

```tcl
# Extract breakdown voltage of a n-p-n bipolar transistor
load_file DATA/IcVcBV_npn_des.plt -name BV
set Vcbs [get_variable_data "collector InnerVoltage" -dataset BV]
set Ics [get_variable_data "collector TotalCurrent" -dataset BV]
ext::ExtractBVi -out BVcboi -name "out" -v $Vcbs -i $Ics -io 1e-12 \
-f "%.3f" 
```

# ext::ExtractBVv

Extracts the breakdown voltage from an I–V curve. The breakdown voltage is defined as the maximum voltage that can be applied to a contact. The curve is represented by two Tcl lists: one contains the voltage points and one contains the corresponding current values.

# Syntax

```txt
ext::ExtractBVv -out <var_name> -v <list_of_r> -i <list_of_r>
    -sign <=1 | -1>
    [-name <string>] [-f <string>] [-info 0 | 1 | 2 | 3] [-help 0 | 1] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-out</td><td>Variable name to store the value of the breakdown voltage. (Real number, no default)</td></tr><tr><td>-v</td><td>List containing the voltage values. (List of real numbers, no default)</td></tr><tr><td>-i</td><td>List containing the current values. (List of real numbers, no default)</td></tr><tr><td>-sign</td><td>Distinguishes different types of bipolar transistor:+1: n-p-n transistor-1: p-n-p transistor In general, set -sign -1 if the breakdown occurs at a negative bias. (No default)</td></tr><tr><td>-name</td><td>Name of the extracted variable to appear in the Sentaurus Workbench Family Tree. Note: If -name &quot;noprint&quot; is used, Sentaurus Workbench extraction is suppressed. If -name &quot;out&quot; is used, the name of the variable specified by the -out keyword also is used as the name that appears in the Sentaurus Workbench Family Tree. (String, default: &quot;BVv&quot;)</td></tr><tr><td>-f</td><td>Format string used to write the extracted variable to the Sentaurus Workbench Family Tree. (String, default: &quot;%.2e&quot;)</td></tr><tr><td>-info 0 | 1 | 2 | 3</td><td>Sets local information level. Default: 0</td></tr><tr><td>-help 0 | 1</td><td>Prints a help screen if set to 1. Default: 0</td></tr></table>

# Returns

None.

# Example

# Extract breakdown voltage of a n-p-n bipolar transistor load_file DATA/IcVcBV_npn_des.plt -name BV set Vcbs [get_variable_data "collector InnerVoltage" -dataset BV] set Ics [get_variable_data "collector TotalCurrent" -dataset BV]

ext::ExtractBVv -out BVcbov -name "out" -v $Vcbs -i $Ics -sign 1 \-f "%.3f"

# ext::ExtractEarlyV

Extracts the Early voltage from an $\mathsf { I } _ { \mathsf { c } } - \mathsf { V } _ { \mathsf { c } \mathsf { e } }$ curve. The curve is represented by two Tcl lists: one contains the voltage points and one contains the corresponding current values.

# Syntax

```perl
ext::ExtractEarlyV -out <var_name> -v <list_of_r> -i <list_of_r>
    -vo <r>
    [-name <string>] [-f <string>] [-info 0 | 1 | 2 | 3] [-help 0 | 1] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-out</td><td>Variable name to store the value of the early voltage. (Real number, no default)</td></tr><tr><td>-v</td><td>List containing the voltage values. (List of real numbers, no default)</td></tr><tr><td>-i</td><td>List containing the collector current values. (List of real numbers, no default)</td></tr><tr><td>-vo</td><td>Bias point at which the slope of the Ic-Vce curve is determined for the computation of the Early voltage. (Real number, no default)</td></tr><tr><td>-name</td><td>Name of the extracted variable to appear in the Sentaurus Workbench Family Tree.</td></tr><tr><td></td><td>Note: If -name &quot;noprint&quot; is used, Sentaurus Workbench extraction is suppressed. If -name &quot;out&quot; is used, the name of the variable specified by the -out keyword also is used as the name that appears in the Sentaurus Workbench Family Tree.</td></tr><tr><td></td><td>(String, default: &quot;Va&quot;)</td></tr><tr><td>-f</td><td>Format string used to write the extracted variable to the Sentaurus Workbench Family Tree. (String, default: &quot;%.3e&quot;)</td></tr><tr><td>-info 0 | 1 | 2 | 3</td><td>Sets local information level. Default: 0</td></tr><tr><td>-help 0 | 1</td><td>Prints a help screen if set to 1. Default: 0</td></tr></table>

# Returns

None.

# Example

```tcl
# Extract Early voltage for a p-n-p bipolar transistor
load_file DATA/IcVc_pnp_des.plt -name IcVce
set Vcs [get_variable_data "collector OuterVoltage" -dataset IcVce]
set Ics [get_variable_data "collector TotalCurrent" -dataset IcVce]
ext::AbsList -out absIcs -x $Ics
# Compute absolute value of collector current
ext::ExtractEarlyV -out Va -name "out" -v $Vcs -i $absIcs -vo -1.25 \
-f "%.2f" 
```

# ext::ExtractExtremum

Extracts the maximum or minimum of a curve. The curve is represented by two Tcl lists: one contains the x-values and one contains the corresponding y-values.

# Syntax

```txt
ext::ExtractExtremum -out <var_name> -x <list_of_r> -y <list_of_r>
[[-type "max" | "min"] [-name <string>] [-f <string>] 
[[-info 0 | 1 | 2 | 3] [-help 0 | 1] 
```

```txt
Argument Description   
-out Variable name to store the maximum or minimum of the curve. (Real number, no default)   
-x List containing the x-values. (List of real numbers, no default)   
-y List containing the y-values. (List of real numbers, no default)   
-type "max" | "min" Selects whether to extract the minimum ("min") or maximum ("max") of a curve. Default: "max"   
-name Name of the extracted variable to appear in the Sentaurus Workbench Family Tree. Note: If -name "noprint" is used, Sentaurus Workbench extraction is suppressed. If -name "out" is used, the name of the variable specified by the -out keyword also is used as the name that appears in the Sentaurus Workbench Family Tree. (String, default: "out") 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-f &lt;string&gt;</td><td>Format string used to write the extracted variable to the Sentaurus Workbench Family Tree. (String, default: &quot;%.3e&quot;)</td></tr><tr><td>-info 0 | 1 | 2 | 3</td><td>Sets local information level. Default: 0</td></tr><tr><td>-help 0 | 1</td><td>Prints a help screen if set to 1. Default: 0</td></tr></table>

# Returns

None.

# Example

```tcl
load_file DATA/IdVgLin_nMOS_des.plt -name DC
set Vgs [get_variable_data "gate OuterVoltage" -dataset DC]
setIds [get_variable_data "drain TotalCurrent" -dataset DC]
ext::ExtractExtremum -out IdLin -name "out" -x $Vgs -y $Ids -type "max" 
```

# ext::ExtractGm

Extracts the maximum transconductance from an $\mathsf { I } _ { \mathsf { d } } - \mathsf { V } _ { \mathsf { g } \mathsf { s } }$ curve. The transconductance $g _ { m }$ is defined as:

$$
g _ {m} = \frac {d I _ {d}}{d V _ {g}} \tag {1}
$$

The gate bias at which the maximum transconductance occurs is computed using parabolic interpolation. The curve is represented by two Tcl lists: one contains the voltage points and one contains the corresponding current values.

# Syntax

```rust
ext::ExtractGm -out <var_name> -v <list_of_r> -i <list_of_r> [-name <string>] [-f <string>] [-info 0 | 1 | 2 | 3] [-help 0 | 1] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-out</td><td>Variable name to store the value of the maximum transconductance. (Real number, no default)</td></tr><tr><td>-v</td><td>List containing the gate voltage values. (List of real numbers, no default)</td></tr><tr><td>-i &lt;list_of_r&gt;</td><td>List containing the drain current values. (List of real numbers, no default)</td></tr><tr><td>-name &lt;string&gt;</td><td>Name of the extracted variable to appear in the Sentaurus Workbench Family Tree. 
Note: 
If -name "noprint" is used, Sentaurus Workbench extraction is suppressed. 
If -name "out" is used, the name of the variable specified by the -out keyword also is used as the name that appears in the Sentaurus Workbench Family Tree. 
(String, default: "gm")</td></tr><tr><td>-f &lt;string&gt;</td><td>Format string used to write the extracted variable to the Sentaurus Workbench Family Tree. (String, default: "%.3e")</td></tr><tr><td>-info 0 | 1 | 2 | 3</td><td>Sets local information level. Default: 0</td></tr><tr><td>-help 0 | 1</td><td>Prints a help screen if set to 1. Default: 0</td></tr></table>

# Returns

None.

# Example

```tcl
# Extract gm for a p-MOSFET
load_file DATA/IdVgLin_pMOS_des.plt -name DC
set Vgs [get_variable_data "gate OuterVoltage" -dataset DC]
setIds [get_variable_data "drain TotalCurrent" -dataset DC]
ext::AbsList -out absIds -x $Ids
ext::ExtractGm -out gmLin -name "out" -v $Vgs -i $absIds
puts "Max gm: [format %.3e $gmLin] S/um"
#-> Max gm: 1.913e-04 S/um 
```

# ext::ExtractIoff

Extracts the drain leakage current at the specified gate voltage from an $\mathsf { I } _ { \mathsf { d } } - \mathsf { V } _ { \mathsf { g } \mathsf { s } }$ curve (computed for a high drain bias). The curve is represented by two Tcl lists: one contains the voltage points and one contains the corresponding current values. The drain leakage current is extracted at a small nonzero gate voltage value to avoid noise.

# Syntax

```txt
ext::ExtractIoff -out <var_name> -v <list_of_r> -i <list_of_r> -vo <r> [-log10 0 | 1] [-name <string>] [-f <string>] [-info 0 | 1 | 2 | 3] [-help 0 | 1] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-out</td><td>Variable name to store the value of the drain leakage current. (Real number, no default)</td></tr><tr><td>-v</td><td>List containing the gate voltage values. (List of real numbers, no default)</td></tr><tr><td>-i</td><td>List containing the drain current values. (List of real numbers, no default)</td></tr><tr><td>-vo</td><td>Gate voltage at which the drain leakage current is extracted. It is recommended to use a small but nonzero value, such as 0.1 mV for an NMOS device and -0.1 mV for a PMOS device. (Real number, no default)</td></tr><tr><td>-log10 0 | 1</td><td>Procedure returns log10(1off) if set to 1. Otherwise, the procedure returns 1off. Default: 0</td></tr><tr><td>-name</td><td>Name of the extracted variable to appear in the Sentaurus Workbench Family Tree. Note: If -name "noprint" is used, Sentaurus Workbench extraction is suppressed. If -name "out" is used, the name of the variable specified by the -out keyword also is used as the name that appears in the Sentaurus Workbench Family Tree. (String, default: "Ioff")</td></tr><tr><td>-f</td><td>Format string used to write the extracted variable to the Sentaurus Workbench Family Tree. (String, default: "%.3e")</td></tr><tr><td>-info 0 | 1 | 2 | 3</td><td>Sets local information level. Default: 0</td></tr><tr><td>-help 0 | 1</td><td>Prints a help screen if set to 1. Default: 0</td></tr></table>

# Returns

None.

# Example

```tcl
load_file DATA/IdVgsat_pMOS_des.plt -name DC
set Vgs [get_variable_data "gate OuterVoltage" -dataset DC]
setIds [get_variable_data "drain TotalCurrent" -dataset DC]
ext::AbsList -out absIds -x $Ids
# Compute absolute value of drain currents
ext::ExtractIoff -out Ioff -name "out" -v $Vgs -i $absIds -vo -1e-4 \
-log10 0
puts "Ioff: [format %.3e $Ioff] A/um"
ext::ExtractIoff -out log10Ioff -name "noprint" -v $Vgs -i $absIds \
-vo -1e-4 -log10 1
puts "Log10Ioff: [format %.3f $log10Ioff]"
#-> Ioff: 4.009e-06 A/um
#-> Log10Ioff: -5.397 
```

# ext::ExtractRdiff

Extracts the differential resistance $R _ { \mathrm { d i f f } }$ from an $\mathsf { I } { - } \mathsf { V }$ curve at a specified voltage. $R _ { \mathrm { d i f f } }$ is defined as:

$$
R _ {\text {d i f f}} = \frac {d V}{d I} \tag {2}
$$

The curve is represented by two Tcl lists: one contains the voltage points and one contains the corresponding current values.

# Syntax

```txt
ext::ExtractRdiff -out <var_name> -v <list_of_r> -i <list_of_r>
-vo <r>
[-yLog 0 | 1] [-xLog 0 | 1] [-name <string>] [-f <string}]
[-info 0 | 1 | 2 | 3] [-help 0 | 1] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-out</td><td>Variable name to store the value of the differential resistance. (Real number, no default)</td></tr><tr><td>-v</td><td>List containing the voltage values. (List of real numbers, no default)</td></tr><tr><td>-i</td><td>List containing the current values. (List of real numbers, no default)</td></tr><tr><td>-vo</td><td>Voltage at which the differential resistance is extracted. (Real number, no default)</td></tr><tr><td>-yLog 0 | 1</td><td>Selects linear (0) or logarithmic (1) interpolation for y-axis values for computing the derivative. See note in ext::DiffList on page 423. Default: 0</td></tr><tr><td>-xLog 0 | 1</td><td>Selects linear (0) or logarithmic (1) interpolation for x-axis values for computing the derivative. See note in ext::DiffList on page 423. Default: 0</td></tr><tr><td>-name &lt;string&gt;</td><td>Name of the extracted variable to appear in the Sentaurus Workbench Family Tree.</td></tr><tr><td></td><td>Note:</td></tr><tr><td></td><td>If -name "noprint" is used, Sentaurus Workbench extraction is suppressed.</td></tr><tr><td></td><td>If -name "out" is used, the name of the variable specified by the -out keyword also is used as the name that appears in the Sentaurus Workbench Family Tree.</td></tr><tr><td></td><td>(String, default: "Rdiff")</td></tr><tr><td>-f &lt;string&gt;</td><td>Format string used to write the extracted variable to the Sentaurus Workbench Family Tree. (String, default: "%.3f")</td></tr><tr><td>-info 0 | 1 | 2 | 3</td><td>Sets local information level. Default: 0</td></tr><tr><td>-help 0 | 1</td><td>Prints a help screen if set to 1. Default: 0</td></tr></table>

# Returns

None.

# Example

```tcl
# Extract on-state output resistance of a p-n-p bipolar transistor load_file DATA/IcVc_pnp_des.plt -name IcVce
set Vcs [get_variable_data "collector OuterVoltage" -dataset IcVce]
set Ics [get_variable_data "collector TotalCurrent" -dataset IcVce]
ext::AbsList -out absIcs -x $Ics 
```

```txt
# Compute absolute value of collector current
ext::ExtractRdiff -out Ron -name "out" -v $Vcs -i $absIcs -vo -1.25 \
-f "%.2e" 
```

```txt
puts "Ron (at Vcs= -1.25 V): [format %.2e $Ron] Ohm-um"
#-> Ron: 3.35e+04 Ohm-um 
```

# ext::ExtractRsh

Calculates the sheet resistance $R _ { \mathrm { s h } } [ \Omega / \mathrm { s q } ]$ and the p-n junction depth of semiconductor layers in the vertical direction in a 2D structure by creating an axis-aligned cutline. It also calculates the total sheet resistance (the sum of the sheet resistance of each layer).

# Note:

This procedure applies only to 2D structures.

The sheet resistance of each semiconductor layer is computed using:

$$
R _ {\mathrm {s h}} = \frac {1}{d} \int_ {0} ^ {\sigma (x) d x} \tag {3}
$$

where $d$ is the thickness of the semiconductor layer, and $\sigma$ is its conductivity given by:

$$
\sigma (x) = q \left[ n (x) \mu_ {n} (x) + p (x) \mu_ {p} (x) \right] \tag {4}
$$

where:

• $q$ is the elementary charge.   
• $n$ and $p$ are the electron and hole density, respectively.   
• $\mu _ { n }$ and $\mu _ { p }$ are the electron and hole mobility, respectively.

The resistivity $\rho$ is given by:

$$
\rho (x) = \frac {1}{\sigma (x)} \tag {5}
$$

# Note:

The axis-aligned cutline is created using the create_cutline command (see create_cutline on page 224).

# Syntax

```txt
ext::ExtractRsh -out <array_name> -dataset <dataName>
-semdataset <dataName>
-type <x | y> -at <r>
[-info 0 | 1 | 2 | 3] [-help 0 | 1] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-out &lt;array_name&gt;</td><td>Name of an array to store the results. The array has one string-valued index. The index contains the elements d, Rsh, RshTotal, RshTop, xjTop, and other elements.The values of the elements d and Rsh are the thickness and sheet resistance of each semiconductor layer.The values of the elements RshTotal, RshTop, and xjTop are the total sheet resistance, the sheet resistance of the top semiconductor layer, and the junction depth, respectively. The index also contains the elements x (for -type y) or Y (for -type x), DopingConcentration, eMobility, hMobility, eDensity, hDensity, Conductivity, and Resistivity.The values of the elements x and y are lists of x-axis values and y-axis values, respectively.The values of the elements DopingConcentration, eMobility, hMobility, eDensity, hDensity, Conductivity, and Resistivity are lists of the doping concentration, electron mobility, hole mobility, electron density, hole density, conductivity, and resistivity, respectively.(Array name, no default)</td></tr><tr><td>-dataset &lt;dataname&gt;</td><td>Name of the dataset from where the outline will be generated.(String, no default)</td></tr><tr><td>-semdataset &lt;dataname&gt;</td><td>Name of the dataset containing the variables x (for -type y) or Y (for -type x), DopingConcentration, eMobility, hMobility, eDensity, hDensity, Conductivity, and Resistivity. These variables contain a list of x-axis values (for -type y), or y-axis values (for -type x), doping concentration, electron mobility, hole mobility, electron density, hole density, conductivity, and resistivity, respectively. (String, no default)</td></tr><tr><td>-type x | y</td><td>Links the outline to the specified axis. If -type x (-type y) is specified, the outline is linked to the x-axis (y-axis), and the outline is created axis-aligned to the y-axis (x-axis). Specify -type so that the outline is created in the vertical direction. (String, no default)</td></tr><tr><td>-at &lt;r&gt;</td><td>Value where the axis-aligned outline cuts the axis to which it is linked.(Real number, no default)</td></tr><tr><td>-info 0 | 1 | 2 | 3</td><td>Sets local information level. Default: 0</td></tr><tr><td>-help 0 | 1</td><td>Prints a help screen if set to 1. Default: 0</td></tr></table>

# Returns

None.

# Example

```tcl
load_file DATA/LDMOS_des.tdr -name Structure2d
create_plot -name PlotSTRUCTURE2d -dataset Structure2d
# Create outline at y=5.0 and extract Rsh
ext::ExtractRsh -out Rsh -dataset Structure2d -semdataset RshProfile \
-type y -at 5.0
# Extract sheet resistance of top layer
puts "DOE: Rshtop [format %.2e $Rsh(RshTop)]"
# Extract p-n junction depth
puts "DOE: xj [format %.3f $Rsh(xjTop)]"
puts "Rshtop: [format %.2e $Rsh(RshTop)] Ohm/sq"
puts "xj: [format %.3f $Rsh(xjTop)] um"
# -> Rshtop: 7.36e+04 Ohm/sq
# -> xj: 2.029 um
# Plot conductivity profile
create_plot -1d -name Plot_Report
createCurve -dataset RshProfile -axisX X -axisY Conductivity 
```

# ext::ExtractSS

Extracts the subthreshold voltage swing, for a given gate voltage $\mathsf { V } _ { 9 0 }$ , from an $\mathsf { I } _ { \mathsf { d } } - \mathsf { V } _ { \mathsf { g } \mathsf { s } }$ curve. The subthreshold voltage swing (SS) is defined as:

$$
\mathrm {S S} = \frac {1 0 0 0}{\frac {d}{d V _ {g}} \log_ {1 0} I _ {d}} \tag {6}
$$

where $\mathsf { V } _ { \mathsf { g } }$ is given in V, $\mathsf { I _ { d } }$ is given in $\mathsf { A } / \mu \mathsf { m }$ or A, and SS is given in mV/decade. The curve is represented by two Tcl lists: one contains the voltage points and one contains the corresponding current values.

# Note:

The slope might be noisy at the beginning of the curve or at very low current levels. Better results are often obtained when setting $\mathsf { V } _ { 9 0 }$ to a small but nonzero value.

# Syntax

```txt
ext::ExtractSS -out <var_name> -v <list_of_r> -i <list_of_r> -vo <r> [-name <string>] [-f <string>] [-info 0 | 1 | 2 | 3] [-help 0 | 1] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-out</td><td>Variable name to store the value of the subthreshold voltage swing. (Real number, no default)</td></tr><tr><td>-v</td><td>List containing the gate voltage values. (List of real numbers, no default)</td></tr><tr><td>-i</td><td>List containing the absolute value of the drain currents. (List of real numbers, no default)</td></tr><tr><td>-vo</td><td>Gate voltage at which the slope is extracted. It should be a value well below the threshold voltage. (Real number, no default)</td></tr><tr><td>-name</td><td>Name of the extracted variable to appear in the Sentaurus Workbench Family Tree. Note: If -name &quot;noprint&quot; is used, Sentaurus Workbench extraction is suppressed. If -name &quot;out&quot; is used, the name of the variable specified by the -out keyword also is used as the name that appears in the Sentaurus Workbench Family Tree. (String, default: &quot;SS&quot;)</td></tr><tr><td>-f</td><td>Format string used to write the extracted variable to the Sentaurus Workbench Family Tree. (String, default: &quot;%.3f&quot;)</td></tr><tr><td>-info 0 | 1 | 2 | 3</td><td>Sets local information level. Default: 0</td></tr><tr><td>-help 0 | 1</td><td>Prints a help screen if set to 1. Default: 0</td></tr></table>

# Returns

None.

# Example

load_file DATA/IdVgLin_nMOS_des.plt -name DC set Vgs [get_variable_data "gate OuterVoltage" -dataset DC] set Ids [get_variable_data "drain TotalCurrent" -dataset DC]

set Vgo 1e-2 ext::ExtractSS -out SSlin -name "out" -v $Vgs -i $Ids -vo $Vgo

# ext::ExtractSsub

Extracts the subthreshold voltage swing from an $\mathsf { I } _ { \mathsf { d } } - \mathsf { V } _ { \mathsf { g } \mathsf { s } }$ curve. The subthreshold voltage swing (SS) is defined as:

$$
\mathrm {S S} = \frac {1 0 0 0}{\operatorname {M a x} \left(\frac {d}{d V _ {g}} \log_ {1 0} I _ {d}\right)} \tag {7}
$$

where $\vee _ { \pmb { \sigma } }$ is given in V, $\mathsf { I _ { d } }$ is given in $\mathsf { A } / \mu \mathsf { m }$ or A, SS is given in mV/decade, and

$$
\operatorname {M a x} \left(\frac {d ^ {2}}{d V _ {g}} \log_ {1 0} I _ {d}\right) \text {i s t h e m a x i m a o f} \frac {d}{d V _ {g}} \log_ {1 0} I _ {d}.
$$

The curve is represented by two Tcl lists: one contains the voltage points and one contains the corresponding current values.

# Syntax

```perl
ext::ExtractSsub -out <var_name> -v <list_of_r> -i <list_of_r> [-name <string>] [-f <string>] [-info 0 | 1 | 2 | 3] [-help 0 | 1] 
```

```txt
Argument Description   
-out Variable name to store the value of the subthreshold voltage swing. (Real number, no default)   
-v List containing the gate voltage values. (List of real numbers, no default)   
-i List containing the absolute value of the drain currents. (List of real numbers, no default)   
-name Name of the extracted variable to appear in the Sentaurus Workbench Family Tree. Note: If -name "noprint" is used, Sentaurus Workbench extraction is suppressed. If -name "out" is used, the name of the variable specified by the -out keyword also is used as the name that appears in the Sentaurus Workbench Family Tree. (String, default: "ss")   
-f Format string used to write the extracted variable to the Sentaurus Workbench Family Tree. (String, default: "% .3f")   
-info 0 | 1 | 2 | 3 Sets local information level. Default: 0 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-help 0 | 1</td><td>Prints a help screen if set to 1. Default: 0</td></tr></table>

# Returns

None.

# Example

```tcl
load_file DATA/IdVgLin_nMOS_des.plt -name DC  
set Vgs [get_variable_data "gate OuterVoltage" -dataset DC]  
setIds [get_variable_data "drain TotalCurrent" -dataset DC] 
```

```txt
ext::ExtractSsub -out Ssub -name "out" -v $Vgs -i $Ids
```

# ext::ExtractValue

For a given target x-value, the procedure extracts the $n$ -th interpolated y-value in a curve. The curve is represented by two Tcl lists: one contains the x-values and one contains the corresponding y-values.

# Note:

To find the interpolated x-value for a given y-value, swap the arguments $_ \mathrm { x }$ and y.

# Syntax

```rust
ext::ExtractValue -out <var_name> -x <list_of_r> -y <list_of_r> -xo <r> [-occurrence <i>] [-yLog 0 | 1] [-xLog 0 | 1] [-name <string>] [-f <string>] [-info 0 | 1 | 2 | 3] [-help 0 | 1] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-out</td><td>Variable name to store the first found y-value. (Real number, no default)</td></tr><tr><td>-x</td><td>List containing the x-values. (List of real numbers, no default)</td></tr><tr><td>-y</td><td>List containing the y-values. (List of real numbers, no default)</td></tr><tr><td>-xo</td><td>Target x-value. (Real number, no default)</td></tr><tr><td>-occurrence</td><td>Specifies the n-th interpolated y-value to be extracted. (Integer, default: 1)</td></tr><tr><td>-yLog 0 | 1</td><td>Selects linear (0) or logarithmic (1) interpolation for y-axis values. Default: 0</td></tr><tr><td>-xLog 0 | 1</td><td>Selects linear (0) or logarithmic (1) interpolation for x-axis values. Default: 0</td></tr><tr><td>-name &lt;string&gt;</td><td>Name of the extracted variable to appear in the Sentaurus Workbench Family Tree. Note: If -name "noprint" is used, Sentaurus Workbench extraction is suppressed. If -name "out" is used, the name of the variable specified by the -out keyword also is used as the name that appears in the Sentaurus Workbench Family Tree. (String, default: "SS")</td></tr><tr><td>-f &lt;string&gt;</td><td>Format string used to write the extracted variable to the Sentaurus Workbench Family Tree. (String, default: "%.3f")</td></tr><tr><td>-info 0 | 1 | 2 | 3</td><td>Sets local information level. Default: 0</td></tr><tr><td>-help 0 | 1</td><td>Prints a help screen if set to 1. Default: 0</td></tr></table>

# Returns

None.

# Example

set Xs [list 1e2 1e3 1e4 1e5 1e6 1e7 1e8 1e9 1e10 1e11 1e12]

set Ys [list -100 -25 25 50 100 100 75 50 25 -25 -100]

# Extract the first interpolated x-value for the given target y-value

# using the default linear interpolation

ext::ExtractValue -out Xlin -x $Ys -y $Xs -yLog 0 -xo 0

puts "Xlin: [format %.3e $Xlin]"

# Extract the first interpolated x-value for the given target y-value

# using logarithmic interpolation

ext::ExtractValue -out Xlog -x $Ys -y $Xs -yLog 1 -xo 0

puts "Xlog: [format %.3e $Xlog]"

# Extract the 2D interpolated x-value for the given target y-value

# using logarithmic interpolation

ext::ExtractValue -out X2nd_log -x $Ys -y $Xs -yLog 1 -xo 0 \

```tcl
-occurrence 2
puts "X2nd_log: [format %.3e $X2nd_log]" 
```

# ext::ExtractVdlin

Extracts the drain voltage for a given drain current level from an ${ \sf I } _ { { \sf d } } - { \sf V } _ { { \sf d } { \sf s } }$ curve using linear interpolation. The curve is represented by two Tcl lists: one contains the voltage points and one contains the corresponding current values.

# Syntax

```txt
ext::ExtractVdlin -out <var_name> -v <list_of_r> -i <list_of_r> -io <r> [-name <string>] [-f <string>] [-info 0 | 1 | 2 | 3] [-help 0 | 1] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-out</td><td>Variable name to store the value of the drain voltage corresponding to the specified drain current level. (Real number, no default)</td></tr><tr><td>-v</td><td>List containing the drain voltage values. (List of real numbers, no default)</td></tr><tr><td>-i</td><td>List containing the drain current values. (List of real numbers, no default)</td></tr><tr><td>-io</td><td>Drain current level. (Real number, no default)</td></tr><tr><td>-name</td><td>Name of the extracted variable to appear in the Sentaurus Workbench Family Tree. Note: If -name &quot;noprint&quot; is used, Sentaurus Workbench extraction is suppressed. If -name &quot;out&quot; is used, the name of the variable specified by the -out keyword also is used as the name that appears in the Sentaurus Workbench Family Tree. (String, default: &quot;ss&quot;)</td></tr><tr><td>-f</td><td>Format string used to write the extracted variable to the Sentaurus Workbench Family Tree. (String, default: &quot;%.3f&quot;)</td></tr><tr><td>-info 0 | 1 | 2 | 3</td><td>Sets local information level. Default: 0</td></tr><tr><td>-help 0 | 1</td><td>Prints a help screen if set to 1. Default: 0</td></tr></table>

# Returns

None.

# Example

```tcl
load_file DATA/IdVd_nMOS_des.plt -name DC
set Vds [get_variable_data "drain OuterVoltage" -dataset DC]
setIds [get_variable_data "drain TotalCurrent" -dataset DC]
ext::ExtractVdlin -out Vdlin -name "out" -v $Vds -i $Ids -io 1e-4 \
-f "%.4f" 
```

# ext::ExtractVdlog

Extracts the drain voltage for a given drain current level from an ${ \sf I } _ { { \sf d } } - { \sf V } _ { { \sf d } { \sf s } }$ curve using logarithmic interpolation. The curve is represented by two Tcl lists: one contains the voltage points and one contains the corresponding current values.

# Syntax

```txt
ext::ExtractVdlog -out <var_name> -v <list_of_r> -i <list_of_r> -io <r>
[-name <string>] [-f <string>] [-info 0 | 1 | 2 | 3] [-help 0 | 1] 
```

```txt
Argument Description   
-out Variable name to store the value of the drain voltage corresponding to   
the specified drain current level. (Real number, no default)   
-v List containing the drain voltage values.   
(list_of_r> (List of real numbers, no default)   
-i List containing the drain current values.   
(list of real numbers, no default)   
-io Drain current level. (Real number, no default)   
-name Name of the extracted variable to appear in the Sentaurus Workbench Family Tree. Note: If -name "noprint" is used, Sentaurus Workbench extraction is suppressed. If -name "out" is used, the name of the variable specified by the -out keyword also is used as the name that appears in the Sentaurus Workbench Family Tree. (String, default: "SS") 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-f &lt;string&gt;</td><td>Format string used to write the extracted variable to the Sentaurus Workbench Family Tree. (String, default: &quot;%.3f&quot;)</td></tr><tr><td>-info 0 | 1 | 2 | 3</td><td>Sets local information level. Default: 0</td></tr><tr><td>-help 0 | 1</td><td>Prints a help screen if set to 1. Default: 0</td></tr></table>

# Returns

None.

# Example

```tcl
load_file DATA/IdVd_nMOS_des.plt -name DC
set Vds [get_variable_data "drain OuterVoltage" -dataset DC]
setIds [get_variable_data "drain TotalCurrent" -dataset DC]
ext::ExtractVdlog -out Vdlog -name "out" -v $Vds -i $Ids -io 1e-4 \
-f "%.4f" 
```

# ext::ExtractVglin

Extracts the gate voltage for a given drain current level from an ${ \sf I } _ { { \sf d } } - { \sf V } _ { { \sf g } { \sf s } }$ curve using linear interpolation. The curve is represented by two Tcl lists: one contains the voltage points and one contains the corresponding current values.

# Syntax

```rust
ext::ExtractVglin -out <var_name> -v <list_of_r> -i <list_of_r> -io <r> [-name <string>] [-f <string>] [-info 0 | 1 | 2 | 3] [-help 0 | 1] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-out</td><td>Variable name to store the value of the drain voltage corresponding to the specified drain current level. (Real number, no default)</td></tr><tr><td>-v</td><td>List containing the drain voltage values. (List of real numbers, no default)</td></tr><tr><td>-i</td><td>List containing the drain current values. (List of real numbers, no default)</td></tr><tr><td>-io</td><td>Drain current level. (Real number, no default)</td></tr><tr><td>-name &lt;string&gt;</td><td>Name of the extracted variable to appear in the Sentaurus Workbench Family Tree.</td></tr><tr><td></td><td>Note:</td></tr><tr><td></td><td>If -name "noprint" is used, Sentaurus Workbench extraction is suppressed.</td></tr><tr><td></td><td>If -name "out" is used, the name of the variable specified by the -out keyword also is used as the name that appears in the Sentaurus Workbench Family Tree.</td></tr><tr><td></td><td>(String, default: "SS")</td></tr><tr><td>-f &lt;string&gt;</td><td>Format string used to write the extracted variable to the Sentaurus Workbench Family Tree. (String, default: "%.3f")</td></tr><tr><td>-info 0 | 1 | 2 | 3</td><td>Sets local information level. Default: 0</td></tr><tr><td>-help 0 | 1</td><td>Prints a help screen if set to 1. Default: 0</td></tr></table>

# Returns

None.

# Example

```tcl
load_file DATA/IdVgLin_nMOS_des.plt -name DC
set Vgs [get_variable_data "gate OuterVoltage" -dataset DC]
setIds [get_variable_data "drain TotalCurrent" -dataset DC]
ExtractVglin -out Vglin -name "out" -v $Vgs -i $Ids -io 1e-7 -f "%.4f" 
```

# ext::ExtractVglog

Extracts the gate voltage for a given drain current level from an $\mathsf { I } _ { \mathsf { d } } - \mathsf { V } _ { \mathsf { g } \mathsf { s } }$ curve using logarithmic interpolation. The curve is represented by two Tcl lists: one contains the voltage points and one contains the corresponding current values.

# Syntax

```txt
ext::ExtractVglog -out <var_name> -v <list_of_r> -i <list_of_r> -io <r>
[-name <string>] [-f <string>] [-info 0 | 1 | 2 | 3] [-help 0 | 1] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-out</td><td>Variable name to store the value of the drain voltage corresponding to the specified drain current level. (Real number, no default)</td></tr><tr><td>-v</td><td>List containing the drain voltage values. (List of real numbers, no default)</td></tr><tr><td>-i</td><td>List containing the drain current values. (List of real numbers, no default)</td></tr><tr><td>-o</td><td>Drain current level. (Real number, no default)</td></tr><tr><td>-name</td><td>Name of the extracted variable to appear in the Sentaurus Workbench Family Tree. Note: If -name &quot;noprint&quot; is used, Sentaurus Workbench extraction is suppressed. If -name &quot;out&quot; is used, the name of the variable specified by the -out keyword also is used as the name that appears in the Sentaurus Workbench Family Tree. (String, default: &quot;SS&quot;)</td></tr><tr><td>-f</td><td>Format string used to write the extracted variable to the Sentaurus Workbench Family Tree. (String, default: &quot;%.3f&quot;)</td></tr><tr><td>-info 0 | 1 | 2 | 3</td><td>Sets local information level. Default: 0</td></tr><tr><td>-help 0 | 1</td><td>Prints a help screen if set to 1. Default: 0</td></tr></table>

# Returns

None.

# Example

```tcl
load_file DATA/IdVgLin_nMOS_des.plt -name DC  
set Vgs [get_variable_data "gate OuterVoltage" -dataset DC]  
setIds [get_variable_data "drain TotalCurrent" -dataset DC] 
```

```txt
ExtractVglog -out Vglog -name "out" -v $Vgs -i $Ids -io 1e-7 -f "%.4f" 
```

# ext::ExtractVtgm

Extracts the threshold voltage from an $\mid _ { \mathsf { d } } - \mathsf { V } _ { \mathsf { g s } }$ curve using the maximum transconductance method. The threshold voltage is defined as the gate–voltage axis intercept of the tangent line at the maximum transconductance $g _ { \mathrm { m } }$ point. The gate bias at which the maximum transconductance occurs is computed using parabolic interpolation. The curve is represented by two Tcl lists: one contains the voltage points and one contains the corresponding current values.

# Syntax

```perl
ext::ExtractVtgm -out <var_name> -v <list_of_r> -i <list_of_r> [-name <string>] [-f <string>] [-info 0 | 1 | 2 | 3] [-help 0 | 1] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-out</td><td>Variable name to store the value of the drain voltage corresponding to the specified drain current level. (Real number, no default)</td></tr><tr><td>-v</td><td>List containing the drain voltage values. (List of real numbers, no default)</td></tr><tr><td>-i</td><td>List containing the drain current values. (List of real numbers, no default)</td></tr><tr><td>-name</td><td>Name of the extracted variable to appear in the Sentaurus Workbench Family Tree. Note: If -name "noprint" is used, Sentaurus Workbench extraction is suppressed. If -name "out" is used, the name of the variable specified by the -out keyword also is used as the name that appears in the Sentaurus Workbench Family Tree. (String, default: "ss")</td></tr><tr><td>-f</td><td>Format string used to write the extracted variable to the Sentaurus Workbench Family Tree. (String, default: "%.3f")</td></tr><tr><td>-info 0 | 1 | 2 | 3</td><td>Sets local information level. Default: 0</td></tr><tr><td>-help 0 | 1</td><td>Prints a help screen if set to 1. Default: 0</td></tr></table>

# Returns

None.

# Example

```tcl
# Extract Vtgm for a p-MOSFET
load_file DATA/IdVgLin_pMOS_des.plt -name DC
set Vgs [get_variable_data "gate OuterVoltage" -dataset DC]
setIds [get_variable_data "drain TotalCurrent" -dataset DC]
ext::AbsList -out absIds -x $Ids 
```

```powershell
ext::ExtractVtgm -out Vtgm -name "out" -v $Vgs -i $absIds
```

```txt
puts "Vt (Max gm method): [format %.3f $Vtgm] V"
#-> Vt (Max gm method): -0.503 V 
```

# ext::ExtractVti

Extracts the threshold voltage for a given subthreshold current level from an $\mathsf { I } _ { \mathsf { d } } - \mathsf { V } _ { \mathsf { g } \mathsf { s } }$ curve. The threshold voltage is defined as the gate voltage at which the drain current reaches the current level. The curve is represented by two Tcl lists: one contains the voltage points and one contains the corresponding current values.

# Syntax

```rust
ext::ExtractVti -out <var_name> -v <list_of_r> -i <list_of_r> -io <r>
[-name <string>] [-f <string>] [-info 0 | 1 | 2 | 3] [-help 0 | 1] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-out</td><td>Variable name to store the value of the drain voltage corresponding to the specified drain current level. (Real number, no default)</td></tr><tr><td>-v</td><td>List containing the drain voltage values. (List of real numbers, no default)</td></tr><tr><td>-i</td><td>List containing the drain current values. (List of real numbers, no default)</td></tr><tr><td>-io &lt;r&gt;</td><td>Subthreshold current level. (Real number, no default)</td></tr><tr><td>-name &lt;string&gt;</td><td>Name of the extracted variable to appear in the Sentaurus Workbench Family Tree.</td></tr><tr><td></td><td>Note: 
If -name "noprint" is used, Sentaurus Workbench extraction is suppressed. 
If -name "out" is used, the name of the variable specified by the -out keyword also is used as the name that appears in the Sentaurus Workbench Family Tree.</td></tr><tr><td></td><td>(String, default: "SS")</td></tr><tr><td>-f &lt;string&gt;</td><td>Format string used to write the extracted variable to the Sentaurus Workbench Family Tree. (String, default: "%.3f")</td></tr><tr><td>-info 0 | 1 | 2 | 3</td><td>Sets local information level. Default: 0</td></tr><tr><td>-help 0 | 1</td><td>Prints a help screen if set to 1. Default: 0</td></tr></table>

# Returns

None.

# Example

```tcl
load_file DATA/IdVgLin_nMOS_des.plt -name DC
set Vgs [get_variable_data "gate OuterVoltage" -dataset DC]
setIds [get_variable_data "drain TotalCurrent" -dataset DC]
set lgate 0.022 ;# um
set io [expr 100e-9/$lgate] ;# subthreshold current level [A/um]
ext::ExtractVti -out VtiLin -name "out" -v $Vgs -i $Ids -io $io 
```

# ext::ExtractVtsat

Extracts the threshold voltage from a $\sqrt { \underline { { I } } _ { \mathrm { d } } } - V _ { \mathrm { g s } }$ curve. The threshold voltage is defined as curve. The gate bias at which the maximum slope of the the intercept with the gate-voltage axis from the point of maximum slope of the $\sqrt { I _ { \mathrm { d } } } - V _ { \mathrm { g s } }$ curve occurs is d $\sqrt { \cal I _ { \mathrm { d } } } - V _ { \mathrm { g s } }$ computed using parabolic interpolation. The curve is represented by two Tcl lists: one contains the voltage points and one contains the corresponding current values.

# Syntax

```txt
ext::ExtractVtsat -out <var_name> -v <list_of_r> -i <list_of_r> [-name <string>] [-f <string>] [-info 0 | 1 | 2 | 3] [-help 0 | 1] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-out</td><td>Variable name to store the value of the drain voltage corresponding to the specified drain current level. (Real number, no default)</td></tr><tr><td>-v</td><td>List containing the drain voltage values. (List of real numbers, no default)</td></tr><tr><td>-i</td><td>List containing the drain current values. (List of real numbers, no default)</td></tr><tr><td>-name</td><td>Name of the extracted variable to appear in the Sentaurus Workbench Family Tree. Note: If -name &quot;noprint&quot; is used, Sentaurus Workbench extraction is suppressed. If -name &quot;out&quot; is used, the name of the variable specified by the -out keyword also is used as the name that appears in the Sentaurus Workbench Family Tree. (String, default: &quot;ss&quot;)</td></tr><tr><td>-f</td><td>Format string used to write the extracted variable to the Sentaurus Workbench Family Tree. (String, default: &quot;% .3f&quot;)</td></tr><tr><td>-info 0 | 1 | 2 | 3</td><td>Sets local information level. Default: 0</td></tr><tr><td>-help 0 | 1</td><td>Prints a help screen if set to 1. Default: 0</td></tr></table>

# Returns

None.

# Example

```tcl
load_file DATA/IdVgLn_nMOS_des.plt -name DC  
set Vgs [get_variable_data "gate OuterVoltage" -dataset DC]  
setIds [get_variable_data "drain TotalCurrent" -dataset DC] 
```

```batch
ext::ExtractVtsat -out VtiLin -name "out" -v $Vgs -i $Ids
```

# ext::FilterTable

Processes data from the Sentaurus Workbench Family Tree for the purpose of creating a graph of one Sentaurus Workbench parameter (y-values) as a function of another Sentaurus Workbench parameter (x-values) for a certain subset of experiments. The data is specified in the form of two lists identifying the x- and y-values, which are preprocessed to create a graph. The condition that an experiment must fulfill to be included in the graph is specified using a pair of target values and a corresponding list of Sentaurus Workbench parameters.

# Syntax

```txt
ext::FilterTable -out <array_name> -x <list_of_r> -y <list_of_r>
-conditions <array_name> -ncond <i>
[-info 0 | 1 | 2 | 3] [-help 0 | 1] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-out</td><td>Name of an array to store the results. The array has one string-valued index. The index contains the elements X and Y. The values of the X element are a subset of a list of values, specified using the keyword -x. These values are in ascending order. The values of the Y element are a subset of a list of values, specified using the keyword -y. All entries of the 'y'-list that contain a nonnumeric value are ignored. (Array name, no default)</td></tr><tr><td>-x</td><td>List containing the values of a Sentaurus Workbench parameter to be preprocessed: the x-values. (List of real numbers, no default)</td></tr><tr><td>-y</td><td>List containing the values of a Sentaurus Workbench parameter to be preprocessed: the y-values. (List of real numbers, no default)</td></tr><tr><td>-conditions</td><td rowspan="2">Array with two indices. The string-indexed array contains the elements "Target" and "Values". The value of the "Target" element contains the required value of a Sentaurus Workbench parameter to be used as a filter condition. The "Values" element contains the corresponding value list of the Sentaurus Workbench parameter for all the experiments.</td></tr><tr><td>&lt;array_name&gt;</td></tr><tr><td></td><td>The second integer counter enumerates the conditions. The enumerations start with 1. (Array name, no default)</td></tr><tr><td>-ncond &lt;i&gt;</td><td>Number of conditions contained in the array specified using the keyword -conditions. (Integer, no default)</td></tr><tr><td>-info 0 | 1 | 2 | 3</td><td>Sets local information level. Default: 0</td></tr><tr><td>-help 0 | 1</td><td>Prints a help screen if set to 1. Default: 0</td></tr></table>

# Returns

None.

# Example

```tcl
# Plot Vt roll-off curve for PMOS under stress
set Types [list nMOS nMOS nMOS nMOS nMOS nMOS nMOS \ pMOS pMOS pMOS pMOS pMOS pMOS pMOS pMOS]
set Lgs [list 0.090 0.090 0.045 0.045 0.130 0.130 0.065 0.065 \ 0.065 0.065 0.065 0.065 0.065 0.065 0.065 0.065 0.065 0.065 0.065 0.065 0.065 0.065 0.065 0.065 0.065 0.182 x x -0.374 -0.324 ]
set Stress [list no yes no yes no yes no yes no yes \ set Vtgms [list 0.424 0.0374 0.313 0.263 0.414 0.364 0.408 0.358 \ -0.344 -0.294 -0.232 -0.182 x x -0.374 -0.324 ]
set Conditions(Target,1) "pMOS"
set Conditions(Values,1) $Types
set Conditions(Target,2) "yes"
set Conditions(Values,2) $Stress
ext::FilterTable -out LgVt -x $Lgs -y $Vtgms -conditions Conditions
-ncond 2
create_variable -name Lg -dataset VtgmLg -values $LgVt(X)
create_variable -name Vtgm -dataset VtgmLg -values $LgVt(Y)
create.plot -ld -name Plot_VtRollOff
createCurve -name VtRollOff -dataset VtgmLg -axisX "Lg" -axisY "Vtgm"
puts "Lg= $LgVt(X)""
puts "Vtgm= $LgVt(Y)" 
```

# Usage Under Sentaurus Workbench

In a Sentaurus Visual script, you can use the dynamic preprocessing feature of Sentaurus Workbench $@$ <parameter_name>:all@ to access a list of input parameters and extracted values for all Sentaurus Workbench experiments. For example, the lists Types, Lgs, Stress, and Vtgms in the above example are generated automatically as a result of the following commands in the Sentaurus Visual script:

```txt
set Types [list @Type:all@]  
set Lgs [list @lgate:all@]  
set Stress [list @stress:all@]  
set Vtgms [list @Vt:all@] 
```

Here, the Tcl list Types contains, for all experiments, the values of the Sentaurus Workbench input parameter Type, which for example takes on the values nMOS or pMOS, depending on whether in this experiment an NMOS or a PMOS structure is created.

Similarly, the Tcl list Lgs contains, for all experiments, a ‘parallel’ list of values of another Sentaurus Workbench input parameter, which for example contains the value of the gate length of the given MOSFETs.

The corresponding extracted parameter can be accessed in the same way. For example, the Tcl list Vtgms contains the extracted values for the threshold voltage for each respective experiment.

# Note:

The values in the various lists might or might not be numeric, and the values might not necessarily be ordered.

The lists of x- and y-values, which will be processed (filtered) to create the graph, are specified using the keywords $- \times$ and -y in the procedure ext::FilterTable. In the above example, the lists of gate lengths $\scriptstyle \left( - \mathbf { x } \ \ \land \mathbf { z } \mathbf { s } \right)$ and $\mathsf { V } _ { \mathsf { t g m } }$ values (-y $Vtgms) are processed by ext::FilterTable.

The keyword -conditions controls the conditions an experiment must fulfill to be included in the graph. The total number of conditions is specified by the keyword -ncond. All the conditions are specified in a string-indexed array using the keyword -conditions. Each condition is defined by both a target value and a corresponding list of Sentaurus Workbench parameters. The target value is the required value of the parameter to be used as a filter condition.

Each element of the string-indexed array has two indices. The first index is either "Target" or "Values". The second index is the condition number. For each condition number:

The target value is specified using the "Target" element (element with first index named "Target") of the array.   
The corresponding list of Sentaurus Workbench parameters is specified using the "Values" element (element with first index named "Values") of the array.

# Appendix F: Extraction Library

ext::FilterTable

In the above example, the following code filters out the gate length $( \mathsf { L } _ { \mathsf { g } } )$ and threshold voltage $( \mathsf { V } _ { \mathsf { t g m } } )$ values for PMOS devices (condition number 1). This condition is defined using the array named Conditions:

set Conditions(Target,1) "pMOS"

set Conditions(Values,1) $Types

Here, the target value is "pMOS" and the corresponding list of Sentaurus Workbench parameters is Types.

To filter out $\mathsf { L } _ { \mathsf { 9 } }$ and $\mathsf { V } _ { \mathsf { t g m } }$ values for devices under stress (condition number 2), the following additional elements of the Conditions array are defined:

set Conditions(Target,2) "yes"

set Conditions(Values,2) $Stress

As a result of specifying both the conditions (-conditions Conditions -ncond 2), the procedure ext::FilterTable filters out $\mathsf { L } _ { \mathsf { g } }$ and $\mathsf { V } _ { \mathsf { t g m } }$ values for PMOS devices under stress.

In the above example, if both the conditions are defined in the Conditions array but the number of conditions is set to 1 (-conditions Conditions -ncond 1), the procedure filters out the gate length and $\mathsf { V } _ { \mathsf { t g m } }$ values for all the PMOS devices (with and without stress). The second condition will not be taken into account.

The procedure returns an array (specified by the keyword -out) with a one string-valued index. The index contains the elements X and Y. The values of the X element are a subset of a list of values, specified using the keyword -x. These values are in ascending order. The values of the Y element are a subset of a list of values, specified using the keyword -y. These lists in the array can be used to create a graph.

In the above example, the procedure returns the array LgVt (-out LgVt) consisting of a list of $\mathsf { L } _ { \mathfrak { g } }$ values and a list of $\mathsf { V } _ { \mathsf { t g m } }$ values for PMOS devices under stress. These lists can be used directly to create the $\breve { \mathsf { V } } _ { \mathtt { t } }$ roll-off curve:

create_variable -name Lg -dataset VtgmLg -values $LgVt(X)

create_variable -name Vtgm -dataset VtgmLg -values $LgVt(Y)

create_plot -1d -name Plot_VtRollOff

create_curve -name VtRollOff -dataset VtgmLg -axisX "Lg" -axisY "Vtgm"

As an additional feature, the ext::FilterTable procedure ignores all entries of the y-values that contain a nonnumeric value. Use this feature to omit failed extractions. In the tool input file that performs the extraction, for example, a previous Sentaurus Visual tool instance, use the #set directive to preset the extracted variable to the value x:

#set Vtgm x

ext::ExtractVtgm -out Vtgm -name "out" -v $Vgs -i $absIds

The actual extraction process, here using the ext::ExtractVtgm procedure, overwrites the preset value $_ \mathrm { x }$ with the actual value. However, if the extraction process fails, the preset value persists.

The output of the above example shows that the $\mathsf { V } _ { \mathsf { t g m } }$ value $\mathbf { \Psi } ( = \mathbf { \Psi } _ { \mathbf { x } } )$ for the 130 nm gate length $\left( \mathtt { L 9 } \mathtt { = } 0 . 1 3 0 \right.$ ) PMOS device under stress is not included in the array LgVt. In addition, the gate lengths in the array $\mathtt { L } \mathtt { g } \mathtt { V } \mathtt { t }$ are in ascending order:

```shell
puts "Lg= $LgVt(X)"  
puts "Vtgm= $LgVt(Y)"  
#-> Lg= 0.045 0.065 0.090  
#-> Vtgm= -0.182 -0.294 -0.324 
```

# ext::FindExtrema

Computes all local extrema (either maxima or minima) of a curve. The curve is represented by two Tcl lists, one containing the x-values (independent variable) and one containing the corresponding y-values (dependent variable).

# Note:

If a curve exhibits a flat top or bottom (two or more neighboring x-values have the same y-value), then the last x-value is returned as the extrema point.

# Syntax

```perl
ext::FindExtrema -out <array_name> -x <list_of_r> -y <list_of_r> [-type "max" | "min"] [-eps <r>] [-info 0 | 1 | 2 | 3] [-help 0 | 1] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-out</td><td>Name of an array to store the results. The array has one string-valued index. The index contains the elements X and Y. The values of the X element are the x-values corresponding to all the extrema. The values of the Y element are the extrema. (Array name, no default)</td></tr><tr><td>-x</td><td>List containing the x-values. These must be in either ascending or descending order. (List of real numbers, no default)</td></tr><tr><td>-y</td><td>List containing the y-values. (List of real numbers, no default)</td></tr><tr><td>-type "max" | "min"</td><td>Selects whether to extract the maxima ("max") or minima ("min") of a curve. Default: "max"</td></tr><tr><td>-eps</td><td>If the difference between two adjacent elements of the list specified using the keyword -y is less than the value of -eps, both elements are considered to be equal. (Real number, default: 1×10-10)</td></tr><tr><td>-info 0 | 1 | 2 | 3</td><td>Sets local information level. Default: 0</td></tr><tr><td>-help 0 | 1</td><td>Prints a help screen if set to 1. Default: 0</td></tr></table>

# Returns

None.

# Example

```tcl
set Xs [list 0.0 1.5 2.0 3.0]
set Ys [list 0.0 1.0 0.5 2.0]
ext::FindExtrema -out XY -x $Xs -y $Ys
puts "All maxima: $XY(Y)""
puts "All x-values corresponding to the maxima: $XY(X)" 
```

# ext::FindVals

For a given target x-value, this procedure extracts all of the corresponding interpolated y-values in a curve. The curve is represented by two Tcl lists: one contains the x-values and one contains the corresponding y-values.

# Note:

To find the interpolated x-values for a given y-value, swap the value of the keywords $- \infty$ and -y.

# Syntax

```rust
ext::FindVals -out <list_name> -x <list_of_r> -y <list_of_r> -xo <r> [-yLog 0 | 1] [-xLog 0 | 1] [-info 0 | 1 | 2 | 3] [-help 0 | 1] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-out</td><td>Name of a list to store the y-values. (List name, no default)</td></tr><tr><td>-x</td><td>List containing the x-values. (List of real numbers, no default)</td></tr><tr><td>-y</td><td>List containing the y-values. (List of real numbers, no default)</td></tr><tr><td>-xo &lt;r&gt;</td><td>Target x-value. (Real number, no default)</td></tr><tr><td>-yLog 0 | 1</td><td>Selects linear (0) or logarithmic (1) interpolation for y-axis values. Default: 0</td></tr><tr><td>-xLog 0 | 1</td><td>Selects linear (0) or logarithmic (1) interpolation for x-axis values. Default: 0</td></tr><tr><td>-info 0 | 1 | 2 | 3</td><td>Sets local information level. Default: 0</td></tr><tr><td>-help 0 | 1</td><td>Prints a help screen if set to 1. Default: 0</td></tr></table>

# Returns

None.

# Example

```tcl
set Xs [list 0.0 1.0 2.0 3.0 4.0]  
set Ys [list 0.0 2.0 4.0 2.0 0.0] 
```

```powershell
# Find all the elements of Xs corresponding to Ys= 2.0 ext::FindVals -out xos -x $Ys -y $Xs -xo 2.0 puts "The elements of Xs corresponding to Ys= 2.0 are $xos" 
```

```perl
# Find the first element of Xs corresponding to Ys= 2.0
ext::ExtractValue -out xos -name "noprint" -x $Ys -y $Xs -xo 2.0
puts "The first element of Xs corresponding to Ys= 2.0 is $xos"
#!/> The elements of Xs corresponding to Ys= 2.0 are 1.0 3.0
#!/> The first element of Xs corresponding to Ys= 2.0 is 1.0 
```

# ext::LinFit

Performs a linear fit $y = x \bullet m + b$ to a curve using least-squares regression. The curve is represented by two Tcl lists, one containing the x-values (independent variable) and one containing the corresponding y-values (dependent variable).

# Syntax

```rust
ext::LinFit -out <array_name> -x <list_of_r> -y <list_of_r> -xmin <r> -xmax <r> [-npar 1 | 2] [-weighted "off" | "on"] [-weights <list_of_r>] [-info 0 | 1 | 2 | 3] [-help 0 | 1] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-out &lt;array_name&gt;</td><td>Name of an array to store the results. The array has one string-valued index. The index contains the elements X, Y, Yestimate, residuals, slope, yintercept, n, dof, and RMSE. The values of the X element are a subset of a list of values, specified using the keyword -x. The values of the Y element are a subset of a list of values, specified using the keyword -y. The values of the Yestimate, residuals, slope, yintercept (for -npar 2), dof, and RMSE elements are the estimated Y values (yi), the residuals (ei), the estimated slope (m), the estimated y-intercept (b), the degrees of freedom ( dof), and the root-mean-square error (RMSE), respectively. The value of the n element is the number of elements (n) in the list represented by the X element. (Array name, no default)</td></tr><tr><td>-x &lt;list_of_r&gt;</td><td>List containing the x-values. These must be in either ascending or descending order. (List of real numbers, no default)</td></tr><tr><td>-y &lt;list_of_r&gt;</td><td>List containing the y-values. (List of real numbers, no default)</td></tr><tr><td>-xmin &lt;r&gt;</td><td>Minimum x-value in the range of x-values over which the linear fit is performed. (Real number, no default)</td></tr><tr><td>-xmax &lt;r&gt;</td><td>Maximum x-value in the range of x-values over which the linear fit is performed. (Real number, no default)</td></tr><tr><td>-npar 1 | 2</td><td>Number of computed parameters. If -npar 1 is used, only the slope is computed and the y-intercept is assumed to be 0. Default: 2</td></tr><tr><td>-weighted "off" | "on"</td><td>Selects either unweighted ("off") or weighted ("on") linear regression. Default: "off"</td></tr><tr><td>-weights &lt;list_of_r&gt;</td><td>List containing the values of the weights for each x-value. (List of real numbers, no default)</td></tr><tr><td>-info 0 | 1 | 2 | 3</td><td>Sets local information level. Default: 0</td></tr><tr><td>-help 0 | 1</td><td>Prints a help screen if set to 1. Default: 0</td></tr></table>

# Returns

None.

# Example

```perl
set Xs [list 20 60 100 140 180 220 260 300 340 380]  
set Ys [list 0.18 0.37 0.35 0.78 0.56 0.75 1.18 1.36 1.17 1.65]  
ext::LinFit -out XY -x $Xs -y $Ys -xmin [lindex $Xs 0] \ -xmax [lindex $Xs end]  
puts "Estimated slope= $XY(slope)"  
puts "Estimated y-intercept= $XY(yintercept)"  
puts "Root-MSE= $XY(RMSE)"  
#-> Estimated slope= 0.00383  
#-> Estimated y-intercept= 0.06924  
#-> Root-MSE= 0.159 
```

# Linear Fitting Using Least-Squares Regression

The regression curve of Y as a function of X is:

$$
y = x \bullet m + b \tag {8}
$$

where is the slope andm $^ b$ is the y-intercept.

The residual $e _ { i }$ of the $i$ -th data point $( x _ { i } , y _ { i } )$ is defined as:

$$
e _ {i} = y _ {i} - \hat {y} _ {i} \tag {9}
$$

where $y _ { i }$ is the estimate of the y-value of the $i$ -th data point.

The sum of squares due to error (SSE) is defined as:

$$
\mathrm {S S E} = \sum_ {i = 1} ^ {n} e _ {i} ^ {2} = \sum_ {i = 1} ^ {n} \left(y _ {i} - \hat {y} _ {i}\right) ^ {2} \tag {10}
$$

Here, the number of the data point is $n$ .

The fitted or estimated regression line:

$$
\hat {y} = x \cdot \hat {m} + \hat {b} \tag {11}
$$

is computed by minimizing SSE. Here, $\hat { y } , \hat { m }$ , and $\hat { b }$ are the estimated y-value, slope, and y-intercept, respectively [1].

The RMSE is defined as:

$$
\mathrm {R M S E} = \sqrt {\frac {\mathrm {S S E}}{\mathrm {d o f}}} \tag {12}
$$

where the degrees of freedom (dof) for $n$ data points is defined as:

$$
\operatorname {d o f} = n - 2 \tag {13}
$$

# ext::Linspace

Creates a list of $n$ linearly spaced values between and including two real numbers (xmin and xmax).

# Syntax

```rust
ext::Linspace -out <list_name> -xmin <r> -xmax <r> -n <i> [-info 0 | 1 | 2 | 3] [-help 0 | 1] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-out &lt;list_name&gt;</td><td>Name of a list to store the list of linearly spaced values. (List name, no default)</td></tr><tr><td>-xmin &lt;r&gt;</td><td>Minimum x-value in the range of x-values over which the list is obtained. (Real number, no default)</td></tr><tr><td>-xmax &lt;r&gt;</td><td>Maximum x-value in the range of x-values over which the list is obtained. (Real number, no default)</td></tr><tr><td>-n &lt;i&gt;</td><td>Number of values created, where the value of -n should be a positive integer greater than 1. (Integer, no default)</td></tr><tr><td>-info 0 | 1 | 2 | 3</td><td>Sets local information level. Default: 0</td></tr><tr><td>-help 0 | 1</td><td>Prints a help screen if set to 1. Default: 0</td></tr></table>

# Returns

None.

# Example

```perl
Create a list of 11 linearly spaced values between 0 and 1
ext::Linspace -out X -xmin 0 -xmax 1 -n 11
puts "Xs: $X"
#-> Xs: 0 0.1 0.2 0.3 0.4 0.5 0.6 0.7 0.8 0.9 1 
```

# ext::LinTransList

Applies a linear transformation to the elements of a list. The elements of the list are replaced by the transformed values given by:

$X^{\prime} = X\bullet m + b$ (14)

# Syntax

```rust
ext::LinTransList -out <list_name> -x <list_of_r> [-m <r>] [-b <r>] [-info 0 | 1 | 2 | 3] [-help 0 | 1] 
```

```txt
Argument Description  
-out Name of a list to store the list of transformed values. (List name, no default)  
-x Input list. (List of real numbers, no default)  
-m Slope of the linear transformation. (Real number, default: 1.0)  
-b Offset of the linear transformation. (Real number, default: 0.0)  
-info 0 | 1 | 2 | 3 Sets local information level. Default: 0  
-help 0 | 1 Prints a help screen if set to 1. Default: 0 
```

# Returns

None.

# Example

```tcl
load_file DATA/IdVgLin_nMOS_des.plt -name DC  
create.plot -1d -name Plot_IdVg  
set Vgs [get_variable_data "gate OuterVoltage" -dataset DC]  
setIds [get_variable_data "drain TotalCurrent" -dataset DC]  
ext::LinTransList -out VgTrans -x $Vgs -b 0.55  
;# Shift Vg values by 0.55 V 
```

```tcl
ext::LinTransList -out IdTrans -x $Ids -m 1e6
;# Scale Id values from A/um to mA/mm
# Create the shifted and scaled Id-Vg curve
create_variable -name VgTrans -dataset IdVgTrans -values $VgTrans
create_variable -name IdTrans -dataset IdVgTrans -values $IdTrans
create_plot -ld -name Plot_IdVg
createCurve -name IdVgTrans -dataset IdVgTrans \
-axisX "VgTrans" -axisY "IdTrans 
```

# ext::Log10List

Applies the log10 function to the elements of a list. The elements of the list are replaced by the function values.

# Syntax

```txt
ext::Log10List -out <list_name> -x <list_of_r> [-info 0 | 1 | 2 | 3] [-help 0 | 1] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-out</td><td>Name of a list to store the list of values. (List name, no default)</td></tr><tr><td>-x</td><td>Input list. (List of real numbers, no default)</td></tr><tr><td>-info 0 | 1 | 2 | 3</td><td>Sets local information level. Default: 0</td></tr><tr><td>-help 0 | 1</td><td>Prints a help screen if set to 1. Default: 0</td></tr></table>

# Returns

None.

# Example

```txt
set Xs [list 10 100 1000]  
ext::Log10List -out Ys -x $Xs  
puts "log10(Xs): $Ys"  
#!/> log10(Xs): 1.0 2.0 3.0 
```

# ext::RemoveDuplicates

For a pair of lists $_ \mathrm { x }$ and y, removes duplicate elements of the list $_ \textrm { x }$ and the corresponding elements of the list y.

# Syntax

```txt
ext::RemoveDuplicates -out <array_name> -x <list_of_r> -y <list_of_r> [-eps <r>] [-info 0 | 1 | 2 | 3] [-help 0 | 1] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-out &lt;array_name&gt;</td><td>Name of an array to store the results. The array has one string-valued index. The index contains the elements X and Y. The values of the X element are a subset of a list of values, specified using the keyword -x. These do not contain duplicate values. The corresponding elements of the list specified using the keyword -y are stored in the Y element. The values of the Y element are a subset of a list of values, specified using the keyword -y. (Array name, no default)</td></tr><tr><td>-x &lt;list_of_r&gt;</td><td>Input list. (List of real numbers, no default)</td></tr><tr><td>-y &lt;list_of_r&gt;</td><td>Input list. (List of real numbers, no default)</td></tr><tr><td>-eps &lt;r&gt;</td><td>If the difference between two adjacent elements of the list specified using the keyword -x is less than -eps, the first element is removed. (Real number, default: 10-40)</td></tr><tr><td>-info 0 | 1 | 2 | 3</td><td>Sets local information level. Default: 0</td></tr><tr><td>-help 0 | 1</td><td>Prints a help screen if set to 1. Default: 0</td></tr></table>

# Returns

None.

# Example

```solidity
set x [list 1 1 2 3 1 1 2 2 2 3]  
set y [list 10 20 30 40 50 60 70 80 90 100] 
```

```perl
ext::RemoveDuplicates -out XY -x $x -y $y 
```

```shell
set Xs $XY(X)
set Ys $XY(Y)
puts "Xs: $Xs
puts "Ys: $Ys 
```

```txt
--Xs:123123   
--Ys:2030406090100 
```

# ext::RemoveZeros

For a pair of lists $_ \mathrm { x }$ and y, removes zero elements of the list $_ \mathrm { x }$ and the corresponding elements of the list y.

# Syntax

```txt
ext::RemoveZeros -out <array_name> -x <list_of_r> -y <list_of_r> [-iplists "x" | "y" | "xy"] [-eps <r>] [-info 0 | 1 | 2 | 3] [-help 0 | 1] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-out &lt;array_name&gt;</td><td>Name of an array to store the results. The array has one string-valued index. The index contains the elements X and Y. The values of the X element are a subset of a list of values, specified using the keyword -x. These do not contain zero values. The corresponding elements of the list specified using the keyword -y are stored in the Y element. The values of the Y element are a subset of a list of values, specified using the keyword -y. (Array name, no default)</td></tr><tr><td>-x &lt;list_of_r&gt;</td><td>Input list. (List of real numbers, no default)</td></tr><tr><td>-y &lt;list_of_r&gt;</td><td>Input list. (List of real numbers, no default)</td></tr><tr><td>-iplists &quot;x&quot; | &quot;y&quot; | &quot;xy&quot;</td><td>Input list from which zeros are removed. If -iplists &quot;x&quot; is used, the zeros are removed from the list specified using the keyword -x. If -iplists &quot;xy&quot; is used, zeros are removed from both lists specified using the keywords -x and -y. (String, no default)</td></tr><tr><td>-eps &lt;r&gt;</td><td>If an element of the list specified using the keyword -x is less than value of -eps, it is removed. (Real number, default: 10-40)</td></tr><tr><td>-info 0 | 1 | 2 | 3</td><td>Sets local information level. Default: 0</td></tr><tr><td>-help 0 | 1</td><td>Prints a help screen if set to 1. Default: 0</td></tr></table>

# Returns

None.

# Example

```tcl
set xs [list 0 1 2 3 0 -1]
set ys [list 10 20 30 40 50 0]
# Remove zeros only from list xs
ext::RemoveZeros -out XY -x $xs -y $ys -iplists "x"
puts "Xs: $XY(X)"
puts "Ys: $XY(Y)"
#-> Xs: 1 2 3 -1
#-> Ys: 20 30 40 0 
```

# ext::SubLists

Creates a pair of sublists from a pair of lists. One of the lists is the list of x-values. The second list is the list of y-values. The sublist is created using a range of x-values.

# Note:

To create a pair of sublists using a range of y-values, swap the keywords -x and -y, and specify the range of y-values using the keywords -xmin and -xmax. To create a sublist from a single list, specify the value of the list using both the $- \times$ and -y keywords.

# Syntax

```perl
ext::SubLists -out <array_name> -x <list_of_r> -y <list_of_r> -xmin <r> -xmax <r> [-info 0 | 1 | 2 | 3] [-help 0 | 1] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-out</td><td>Name of an array to store the results. The array has one string-valued index. The index contains the elements X and Y. The values of the X element are a subset of a list of values, specified using the keyword -x. The values of the Y element are a subset of a list of values, specified using the keyword -y. (Array name, no default)</td></tr><tr><td>-x</td><td>List containing the x-values. These must be in either ascending or descending order. (List of real numbers, no default)</td></tr><tr><td>-y</td><td>List containing the y-values. (List of real numbers, no default)</td></tr><tr><td>-xmin</td><td>Minimum x-value in the range of x-values over which the sublist is obtained. (Real number, no default)</td></tr><tr><td>-xmax &lt;r&gt;</td><td>Maximum x-value in the range of x-values over which the sublist is obtained. (Real number, no default)</td></tr><tr><td>-info 0 | 1 | 2 | 3</td><td>Sets local information level. Default: 0</td></tr><tr><td>-help 0 | 1</td><td>Prints a help screen if set to 1. Default: 0</td></tr></table>

# Returns

None.

# Example

set xs [list 1 2 3 4 5 6 7]

set ys [list 10 20 30 40 50 60 70]

ext::SubLists -out XY -x $xs -y $ys -xmin 2 -xmax 5

puts "Xs: $XY(X)"

puts "Ys: $XY(Y)"

#-> Xs: 2 3 4 5

#-> Ys: 20 30 40 50

# lib::SetInfoDef

Sets the default information level.

# Note:

Level 0: Warning, error, or status messages only.

Level 1: Echo results.

Level 2: Show progress and some debug information.

Level 3: Show all debug information.

The local information level also can be set using the -info keyword of the procedures in the extraction library.

# Syntax

lib::SetInfoDef 0 | 1 | 2 | 3

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;info_level&gt;</td><td>Sets the default information level. Default: 0</td></tr></table>

# Returns

None.

# Example

lib::SetInfoDef 2

# References

[1] W. H. Press et al., Numerical Recipes in C: The Art of Scientific Computing, Cambridge: Cambridge University Press, 2nd ed., 1992.

# G

# GImpedance Field Method Data Postprocessing Library

This appendix provides information about the impedance field method data postprocessing library.

# Overview

The impedance field method in Sentaurus Device provides an accurate and efficient way to evaluate the effects of random variability on the electrical behavior of semiconductor devices (see Sentaurus™ Device User Guide, Chapter 23).

Within the statistical impedance field method (sIFM), Sentaurus Device generates many randomized realizations of a reference device. For example, 10000 realizations with different randomized doping distributions, different randomized gate oxide thicknesses, different randomized metal grain boundaries, and so on.

For each of these individual randomizations, Sentaurus Device computes, at each bias point, the linear current response of the randomizations with respect to the reference device.

The impedance field method (IFM) data postprocessing library helps to manage and analyze large amounts of linear current response data. For example, the IFM library allows you to conveniently apply standard statistical analysis methods to data such as computing and visualizing the distribution and comparing it to a Gaussian distribution.

The IFM library also supports the construction of the individual electrical characteristics of the randomized devices from the electrical characteristics of the reference device and the linear current response data.

The IFM library is loaded automatically when Sentaurus Visual starts. However, if you have switched off the automatic loading of extension libraries, then you can load the IFM library explicitly with the command:

load_library ifm

# Syntax Conventions

The IFM library uses a unique namespace identifier $\left( \mathrm { i } \operatorname { f m } : : \right)$ for its procedures. All procedures and variables associated with this library are called with the namespace identifier prepended. For example:

ifm::<proc_name>

Each procedure has several arguments. The IFM library uses an input parser that accepts arguments of the form:

-keyword <value>

# Note:

All Sentaurus Visual libraries support the standard Sentaurus Visual syntax in which keywords are preceded by a dash. For backward compatibility, all Sentaurus Visual libraries continue to support the keyword $=$ <value> syntax as well. For each procedure call, you can use either the -keyword <value> syntax or the keyword $=$ <value> syntax. However, within any one procedure call, only one type of syntax can be used. Otherwise, an error message will be generated. Only the new syntax is documented. If you want to continue using the keyword $=$ <value> syntax, you also can insert space between the keyword and the equal sign, for example, keyword $=$ <value>. Omitting the space between the equal sign and the value field will result in a failure if the value is a de-referenced Tcl variable. Use keyword $=$ $val (not keyword=$val).

The parser accepts arguments in any order. For some arguments, default values are predefined. Such arguments can be omitted. If arguments for which no defaults are predefined are omitted, the procedure will exit with an error message. In addition, unrecognized arguments result in an error message.

Some procedures of the IFM library compute large and complex data structures. For such data structures, the standard Tcl method of using the return value of the procedure to pass results back to the calling program is not suitable. Therefore, for some datasets, the IFM library uses a passing-by-reference method to exchange information between the procedure and the calling program. Procedure arguments that use the passing-by-reference method are identified with -keyword <var_name>, <list_name>, or <array_name>.

The following conventions are used for the syntax of Tcl commands:

Angle brackets – <> – indicate text that must be replaced, but they are not part of the syntax. In particular, the following type identifiers are used:

◦ <r>: Replace with a real number, or a de-referenced Tcl variable that evaluates to a real number. For example: $val.

# Appendix G: Impedance Field Method Data Postprocessing Library Help for Procedures

◦ <i>: Replace with an integer, or a de-referenced Tcl variable that evaluates to an integer. For example: $\$ 1$ .   
◦ <string>: Replace with a string, or a de-referenced Tcl variable that evaluates to a string. For example: $file.   
◦ <list_of_r>: Replace with a list of real numbers, or a de-referenced Tcl variable that evaluates to a list of real numbers. For example: $\$ 1$ values.   
◦ <list_of_strings>: Replace with a list of strings, or a de-referenced Tcl variable that evaluates to a list of strings. For example: $files.   
◦ <var_name>: Replace with the name of a local Tcl variable. For example: val (not $val).   
◦ <list_name>: Replace with the name of a local Tcl list. For example: values (not $values).   
◦ <array_name>: Replace with the name of a local Tcl array. For example: myarray (not $myarray).

• Brackets – [] – indicate that the argument is optional, but they are not part of the syntax.   
• A vertical bar – | – indicates options, only one of which can be specified.

# Help for Procedures

To request help on a specific procedure, in Tcl mode, set the -help keyword to 1:

ifm::<procedure_name> -help 1

If this command is included in a Sentaurus Visual file, when Sentaurus Visual is executed in:

Batch mode in Sentaurus Workbench, the help information is printed to the runtime output file (with the extension .out) of the corresponding Sentaurus Visual node.   
Interactive mode in Sentaurus Workbench, the help information is displayed in the Tcl Console as well as printed in the Sentaurus Visual output file.

You also can enter the command in the Tcl Console of the user interface, in which case, the help information is displayed in the Console.

# Output of Procedures

All procedures of the IFM library pass the results back to the calling program by storing the results in a Tcl variable or a Tcl array. The name of this Tcl variable or array is specified as the value of the -out keyword.

If there are errors in the IFM library procedures, the behavior of Sentaurus Visual depends on whether it is executed in batch mode or interactive mode in Sentaurus Workbench. In batch mode, Sentaurus Visual exits and an error message is printed only in the Sentaurus Visual error file (with the extension .err). In interactive mode, the error message is displayed in the Tcl Console as well as printed in the Sentaurus Visual error file.

All procedures also print several messages (including warning messages). If Sentaurus Visual is executed in batch mode, the messages are printed only in the Sentaurus Visual output file; whereas, in interactive mode, the messages are displayed in the Tcl Console as well as printed in the Sentaurus Visual output file.

The amount of information printed depends on the information level specified by the procedure lib::SetInfoDef.

# ifm::Gauss

Computes the y-value of a normalized Gaussian distribution for a given x-value:

$$
y = \frac {N}{\sigma \sqrt {2 \pi}} \exp \left(- \frac {1}{2} \left(\frac {x - \mu}{\sigma}\right) ^ {2}\right) \tag {15}
$$

where $N$ is the norm of the Gaussian distribution, $\mu$ is the average, and is the standard σ deviation.

# Syntax

```txt
ifm::Gauss -out <var_name> -x <r> -moments <array_name> [-help 0 | 1] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-out</td><td>Variable name to store the corresponding y-value of the normalized Gaussian distribution.</td></tr><tr><td>-x</td><td>The x-value. (Real number, no default)</td></tr><tr><td>-moments</td><td>Name of an array with one string-valued index, which contains the elements norm, ave, and std_dev. The values of these elements contain the requested norm, the average, and the standard deviation of the Gaussian. 
(Array name, no default)</td></tr><tr><td>-help 0 | 1</td><td>Prints a help screen if set to 1. Default: 0</td></tr></table>

# Returns

None.

# Example

```txt
set Moments(norm) 1.0
set Moments(ave) 0.0
set Moments(std_dev) 1.0
ifm::Gauss -out G -x 0.1 -moments Moments
puts "The result is $G" 
```

# ifm::GetDataQuantiles

Computes quantiles for a list of random variables.

This procedure sorts a list of random values and associates each value with the corresponding quantile (a value between 0 and 1).

# Syntax

```txt
ifm::GetDataQuantiles -out <array_name> -rvs <list_of_r> [-help 0 | 1] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-out</td><td>Name of an array to store the results. The array has one string-valued index, which contains the elements x and y. The values of these elements contain the sorted random variables (x) and the corresponding quantiles (y). (Array name, no default)</td></tr><tr><td>-rvs</td><td>List of random variables. (List of real numbers, no default)</td></tr><tr><td>-help 0 | 1</td><td>Prints a help screen if set to 1. Default: 0</td></tr></table>

# Returns

None.

# Example

```tcl
set RanVals [list -1.657 0.7661 2.142 1.189 -1.919 -0.6670 -0.1915 0.3662]
ifm::GetDataQuantiles -out DataQ -rvs $RanVals
puts $DataQ(X)
#+-> -1.919 -1.657 -0.6670 -0.1915 0.3662 0.7661 1.189 2.142
puts $DataQ(Y)
#+-> 0.0625 0.1875 0.3125 0.4375 0.5625 0.6875 0.8125 0.9375 
```

# ifm::GetGaussian

Computes either a Gaussian curve:

$$
G (x) = \frac {N}{\sigma \sqrt {2 \pi}} \exp \left(- \frac {1}{2} \left(\frac {x - \mu}{\sigma}\right) ^ {2}\right) \tag {16}
$$

or the quantiles of a Gaussian curve:

$$
Q (x) = \int_ {x \min } ^ {x} G (x) d x \tag {17}
$$

where $N$ is the norm of the Gaussian distribution, $\mu$ is the average, and is the standard σ deviation.

# Syntax

```txt
ifm::GetGaussian -out <array_name> -moments <array_name> [-nsam <i>] [-type f | q] [-xmin <r] [-xmax <r] [-help 0 | 1] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-out</td><td>Name of an array to store the results. The array has one string-valued index, which contains the elements x and y. The values of these elements represent the lists of x- and y-values of the Gaussian or quantile. (Array name, no default)</td></tr><tr><td>-moments</td><td>Name of an array with one string-valued index, which contains the elements norm, ave, and std_dev. The values of these elements contain the requested norm, the average, and the standard deviation of the Gaussian. (Array name, no default)</td></tr><tr><td>-nsam</td><td>Number of sample points. (Integer, default: 80)</td></tr><tr><td>-type f | q</td><td>f: A Gaussian curve defined by the given moments is returned. q: The quantiles of this Gaussian are returned. Default: f</td></tr><tr><td>-xmin</td><td>Starting x-value. (Real number, default: -3.0)</td></tr><tr><td>-xmax</td><td>Ending x-value. (Real number, default: 3.0)</td></tr><tr><td>-help 0 | 1</td><td>Prints a help screen if set to 1. Default: 0</td></tr></table>

# Appendix G: Impedance Field Method Data Postprocessing Library ifm::GetGaussian

# Returns

None.

# Example

create_plot -ld -name Gaussian
selectplots Gaussian
set Moments(norm) 1.0
set Moments(ave) 0.0
set Moments(std_dev) 1.0
ifm::GetGaussian -out Gaussian -type f -moments Moments \
-nsam 100 -xmin -3.5 -xmax 3.5
create_variable -name "GX" -dataset GXY -values \\(Gaussian(X)
create_variable -name "GY" -dataset GXY -values \\)Gaussian(Y)
createCurve -name gauss -dataset GXY -axisX "GX" -axisY "GY"

# ifm::GetHistogram

Computes x- and y-lists to be used to plot a histogram for a given list of random variables, a given plotting range, and a given number of bins.

# Syntax

```txt
ifm::GetHistogram -out <array_name> -rvs <list_of_r> -xmin <r> -xmax <r> [-nbin <i>] [-info 0 | 1 | 2 | 3] [-help 0 | 1] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-out</td><td>Name of an array to store the results. The array has one string-valued index, which contains the elements x and y. The values of these elements represent the lists of x- and y-values of the histogram. (Array name, no default)</td></tr><tr><td>-rvs</td><td>List of random variables. (List of real numbers, no default)</td></tr><tr><td>-xmin</td><td>Starting x-value of histogram. (Real number, no default)</td></tr><tr><td>-xmax</td><td>Ending x-value of histogram. (Real number, no default)</td></tr><tr><td>-nbin</td><td>Number of bins for the histogram. (Integer, default: 40)</td></tr><tr><td>-info 0 | 1 | 2 | 3</td><td>Sets local information level. Default: 0</td></tr><tr><td>-help 0 | 1</td><td>Prints a help screen if set to 1. Default: 0</td></tr></table>

# Returns

None.

# Example

```tcl
create_plot -ld -name Histogram
selectplots Histogram
setRxs [list 1 1.1 2 5 5.1 5.3 6]
ifm::GetHistogram -out Histogram -rvs $Rxs -xmin 0 -xmax 6 -nbin 6
create_variable -name "X" -dataset XY -values $Histogram(X)
create_variable -name "Y" -dataset XY -values $Histogram(Y)
createCurve -name his -dataset XY -axisX "X" -axisY "Y" 
```

# ifm::GetMoments

Computes the norm, the average, the root mean square (rms), the standard deviation, the skewness, and the excess kurtosis for a given list of random variables:

$$
\mu = \frac {1}{N} \sum_ {i} ^ {N} x _ {i} \tag {18}
$$

$$
x _ {\mathrm {r m s}} = \sqrt {\frac {1}{N} \sum_ {i} ^ {N} x _ {i} ^ {2}} \tag {19}
$$

$$
\sigma = \sqrt {\frac {1}{N} \sum_ {i} ^ {N} \left(x _ {i} - \mu\right) ^ {2}} \tag {20}
$$

$$
y = \frac {1}{N \sigma^ {3}} \sum_ {i} ^ {N} \left(x _ {i} - \mu\right) ^ {3} \tag {21}
$$

$$
k = \frac {1}{N \sigma^ {4}} \sum_ {i} ^ {N} \left(x _ {i} - \mu\right) ^ {4} - 3 \tag {22}
$$

where the norm $N$ is given by the number of random values, the index enumerates thei random values, $\mu$ is the average, $x _ { \mathrm { r m s } }$ is the root mean square, is the standard deviation,σ $y$ is the skewness, and $k$ is the excess kurtosis.

# Syntax

```rust
ifm::GetMoments -out <array_name> -rvs <list_of_r> [-info 0 | 1 | 2 | 3] [-help 0 | 1] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-out</td><td>Name of a string-valued array to store the computed moments. This array contains the elements norm, ave, rms, std_dev, skew, and kurtx. The values of these elements contain the computed norm, the average, the rms, the standard deviation, the skewness, and the excess kurtosis of the list of random variables. (Array name, no default)</td></tr><tr><td>-rvs</td><td>List of random variables. (List of real numbers, no default)</td></tr><tr><td>-info 0 | 1 | 2 | 3</td><td>Sets local information level. Default: 0</td></tr><tr><td>-help 0 | 1</td><td>Prints a help screen if set to 1. Default: 0</td></tr></table>

# Returns

None.

# Example

```tcl
set Vs [list 1 2 3 4 5]
ifm::GetMoments -out Moments -rvs $Vs
puts $Moments(norm)
#->5
puts $Moments(ave)
#->3
puts $Moments(rms)
#->3.31662479036
puts $Moments(std_dev)
#->1.41421356237
puts $Moments-skew)
#->0.0
puts $Moments(kurtx)
#->-1.3 
```

# ifm::GetMOSIVs

Constructs the randomized ${ \sf I } _ { { \sf d } } - { \sf V } _ { \sf g }$ curves for MOS-type devices for one or more randomization sources.

The boundary condition that links the linear current response $\delta I _ { \mathrm { v } , d }$ to the nodal drain current $d I _ { \mathrm { v } , d }$ and the gate voltage $d V _ { \mathrm { v } , g }$ variations is given by:

$$
d I _ {\mathrm {v}, d} = \delta I _ {\mathrm {v}, d} + y _ {d, g} d V _ {\mathrm {v}, g} \tag {23}
$$

The index enumerates the randomizations. The given equation gives the freedom toν interpret the linear current response directly as a change of the drain current:

$$
d I _ {\mathrm {v}, d} = \delta I _ {\mathrm {v}, d} \tag {24}
$$

Alternatively, you can interpret it as an adjustment of the gate bias:

$$
d V _ {\mathrm {v}, g} = - \frac {\delta I _ {\mathrm {v} , d}}{y _ {d , g}} \tag {25}
$$

For the linearized system, the following two methods yield identical results:

• The gate voltage adjustment method (dV):

$$
I _ {\mathrm {v}, d} = I _ {\text {r e f}, d} \left(V _ {\text {r e f}, g} - d V _ {\mathrm {v}, g}\right) \tag {26}
$$

• The drain current adjustment method (dI):

$$
I _ {\mathrm {v}, d} = I _ {\text {r e f}, d} \left(V _ {\text {r e f}, g}\right) + d I _ {\mathrm {v}, d} \tag {27}
$$

The drain current and the gate voltage of the reference device are given by and , Iref, d Vref, g $I _ { \mathrm { r e f } , d }$ $V _ { \mathrm { r e f } , g }$ respectively.

The equivalence of these two methods can be verified by expanding the two equations into a Taylor series. For a nonlinear system, the two formulations are not equivalent and, depending on the details of the nonlinearity, one or the other method might give more accurate results. To better understand the implications, consider two limiting cases:

(i) Steeply rising ${ \sf I } _ { { \sf d } } - { \sf V } _ { \sf g }$ in the subthreshold and near-threshold regime

In this regime, variability effects are well approximated by a threshold voltage shift. This means that, while both $\delta I _ { \mathrm { v } , d }$ and $y _ { d , g }$ increase exponentially with increasing gate bias, the ratio of the two quantities $d V _ { \nu , g }$ remains approximately constant. While large values of $d I _ { \mathrm { v } , d }$ can result in unphysical negative output currents for some randomizations, when using the drain current adjustment method, the gate voltage adjustment method always guarantees positive and physical output currents.

(ii) Saturating ${ \sf I } _ { { \sf d } } - { \sf V } _ { \sf g }$ at low drain bias and high gate bias

In this regime, the transconductance $y _ { d , g }$ vanishes and, therefore, $d V _ { \mathrm { v } , g }$ diverges, while $\delta I _ { \mathrm { v } , d }$ remains approximately constant. Consequently, the large values of $d V _ { \mathrm { v } , g }$ can result ν, g in unphysical gate voltages (non-monotonous, or less than ground, or larger than the supply voltage) for some randomizations, when using the gate voltage adjustment method. The drain current adjustment method, however, always guarantees monotonous and physical input voltages.

For the ${ \sf I _ { d } { - } } { \sf V } _ { 9 }$ characteristic, the transition point between the subthreshold and near-threshold regime and the saturation regime can be defined as the point of maximal transconductance and, therefore, you can apply either the gate voltage adjustment method or the drain current adjustment method, depending on the sign of the derivative of the transconductance. This observation is the foundation of the third method:

• The weighted method (weighted):

$$
I _ {\mathrm {v}, d} = I _ {\text {r e f}, d} \left(V _ {\text {r e f}, g} - \frac {1 + W}{2} d V _ {\mathrm {v}, g}\right) \tag {28}
$$

$$
I _ {\mathrm {v}, d} = I _ {\mathrm {r e f}, d} (V _ {\mathrm {r e f}, g}) + \frac {1 - W}{2} d I _ {\mathrm {v}, d}
$$

The weights are computed internally by calling ifm::GetMOSWeights on page 483.W

The weighted method switches between the gate voltage adjustment method and the drain current adjustment method to avoid artificial over-adjustments of the currents or voltages. In situations with relatively large adjustments at the transition point, discontinuities and overlaps might be observed. The smooth option activates a smoothening procedure to eliminate these artifacts at the transition point.

An alternative weighting scheme (SSweighted) switches from the dV method to the dI method when the subthreshold slope becomes larger than the user-defined threshold ss.

This method uses an error function to smooth out the transition, and you can control the smoothness by setting the normalization parameter dss. The weights are computed internally by calling ifm::GetMOSWeights on page 483.

For $\mathsf { I } _ { \mathsf { d } } { - } \mathsf { V } _ { \mathsf { g } }$ sweeps in the linear regime, it is recommended to use one of the weighted methods, preferably the one that gives the smoothest resulting I–V curves.

Finally, the conceptually simpler exponential method ensures nonnegative currents and also avoids gate bias overshoots. This method often gives satisfactory results, but it violates the linearity assumption:

• The exponential method (exp):

$$
I _ {\mathrm {v}, d} = I _ {\text {r e f}, d} \exp \left(\frac {d I _ {\mathrm {v} , d}}{I _ {\text {r e f} , d}}\right) \tag {29}
$$

Even when using the most appropriate ${ \sf I } _ { { \sf d } } - { \sf V } _ { \sf g }$ construction method, it might happen that for a certain randomization, the linear current response $d I _ { \mathrm { v } , d }$ becomes too large compared to the nominal current $I _ { \mathrm { v } , d }$ and the resulting ${ \mathsf I } _ { \mathsf d } { - } { \mathsf V } _ { \mathsf g }$ might exhibit an unexpected shape. This can result in the unreliable extraction of electrical parameters such as the subthreshold slope or the threshold voltage for these specific randomizations. You can flag and filter out such curves by looking at the maximum deviation $\lvert d I _ { \mathrm { v } , d } / I _ { \mathrm { v } , d }$ . The maximum deviation is computed within a user-specified bias range for each constructed ${ \sf I } _ { { \sf d } } - { \sf V } _ { \sf g }$ and is accessible using the array element maxdev of the array that also contains the $\mathbf { X - }$ and y-values of the Id– $\mathsf { V } _ { \mathsf { g } }$ curves. You can limit the bias range by specifying the -vmin and -vmax arguments.

# Syntax

```txt
ifm::GetMOSIVs -out <array_name> -sifm <array_name> -nrow <var_name>  
-ncol <var_name> -v <list_of_r> -i <list_of_r> -y <list_of_r>  
-vmin <r> -vmax <r> -id <string>  
[-type IdVg] [-method dV | dI | weighted | SSweighted | exp]  
[-smooth yes | no] [-sgn 1 | -1] [-ss <r> -dss <r>]  
[-info 0 | 1 | 2 | 3] [-help 0 | 1] 
```

# Argument

-out <array_name>

# Description

Name of a two-indexed array to store the constructed I–V curves.

The first index is string valued. The elements are X and Y.

The second index is integer valued. It represents the randomization index.

The array element values contain the x- and y-value lists of the respective I–V curves.

The array element maxdev contains the maximum deviation:

maxdev $=$ max|dI/I| for vmin $< \mathsf { V } <$ vmax

for the given $\mathsf { I } - \mathsf { V }$ curve. It can be used to filter out curves for which maxdev is too big, for example, greater than 1.

(Array name, no default)

<table><tr><td>Argument</td><td>Description</td></tr><tr><td rowspan="5">-sifm &lt;array_name&gt;</td><td>Name of an array that contains the sIFM data. The array has three indices:</td></tr><tr><td>The first index is string valued. The elements are the variability source identifiers.</td></tr><tr><td>The second index is integer valued. It represents the row or bias index.</td></tr><tr><td>The third index is integer valued. It represents the column or randomization index.</td></tr><tr><td>The array element values contain the sIFM linear current response. (Array name, no default)</td></tr><tr><td>-nrow &lt;var_name&gt;</td><td>Name of a variable containing the number of rows (bias points) in the sIFM data. (Variable name, no default)</td></tr><tr><td>-ncol &lt;var_name&gt;</td><td>Name of a variable containing the number of columns (randomizations) in the sIFM data. (Variable name, no default)</td></tr><tr><td>-v &lt;list_of_r&gt;</td><td>List containing the reference voltage values. (List of real numbers, no default)</td></tr><tr><td>-i &lt;list_of_r&gt;</td><td>List containing the reference current values. (List of real numbers, no default)</td></tr><tr><td>-y &lt;list_of_r&gt;</td><td>List containing the relevant reference Y-matrix values. (List of real numbers, no default)</td></tr><tr><td>-vmin &lt;r&gt;</td><td>Minimum bias for dI/I monitoring.</td></tr><tr><td>-vmax &lt;r&gt;</td><td>Maximum bias for dI/I monitoring.</td></tr><tr><td>-id &lt;string&gt;</td><td>ID of the sIFM variability source. (String, no default)</td></tr><tr><td>-type IdVg</td><td>Currently, only IdVg is supported. Default: IdVg</td></tr><tr><td>-method dV | dI | weighted | SSweighted | exp</td><td>Selects the I-V construction method. Default: weighted</td></tr><tr><td>-smooth yes | no</td><td>Activates I-V smoothening for the weighted method. Default: no</td></tr><tr><td>-sgn 1 | -1</td><td>Set to 1 for NMOS or -1 for PMOS. Default: 1</td></tr><tr><td>-ss &lt;r&gt;</td><td>Subthreshold slope inflection point in mV/decade. (Real, only needed for SSweighted)</td></tr><tr><td>-dss &lt;r&gt;</td><td>Width of transition region in mV/decade. (Real, only needed for SSweighted)</td></tr><tr><td>-info 0 | 1 | 2 | 3</td><td>Sets local information level. Default: 0</td></tr><tr><td>-help 0 | 1</td><td>Prints a help screen if set to 1. Default: 0</td></tr></table>

# Returns

None.

# Example

```tcl
set IDs [list rdf ifft SUM]  
set FILES [list]  
foreach ID $IDs {  
lappend FILES mos${ID}_I_ndrain.csv  
}  
load_file mos_circuit_des.plt -name Data(DC)  
load_file mos_ac_des.plt -name Data(AC)  
set adgs [get_variable_data "a(ndrain,ngate)" -dataset Data(AC)]  
set Vgs [get_variable_data "v(ngate)" -dataset Data(DC)]  
setIds [get_variable_data "i(mos,ndrain)" -dataset Data(DC)]  
ifm::ReadsIFM -out sIFM -nrow Nrow -ncol Ncol -files $FILES -ids $IDs  
create_plot -ld -name RanIV  
selectplots RanIV  
set j 42  
ifm::GetMOSIVs -out IV_rdf -sifm sIFM -nrow Nrow -ncol Ncol \  
-method "weighted" -sgn 1.0 -v $Vgs -i $Ids -y $adgs -id "rdfs" -smooth yes  
create_variable -name V -dataset RanIV(rdf,$j) -values $IV_rdf(X,$j)  
create_variable -name I -dataset RanIV(rdf,$j) -values $IV_rdf(Y,$j)  
createCurve -name IV_rdf($j) -dataset RanIV(rdf,$j) -axisX "V" -axisY "I"  
ifm::GetMOSIVs -out IV_ift -sifm sIFM -nrow Nrow -ncol Ncol \  
-method "weighted" -sgn 1.0 -v $Vgs -i $Ids -y $adgs -id "ift" -smooth yes  
create_variable -name V -dataset RanIV(ift,$j) -values $IV_ift(X,$j)  
create_variable -name I -dataset RanIV(ift,$j) -values $IV_ift(Y,$j)  
createCurve -name IV_ift($j) -dataset RanIV(ift,$j) -axisX "V" -axisY "I"  
ifm::GetMOSIVs -out IV_SUM -sifm sIFM -nrow Nrow -ncol Ncol \
```

```txt
-method "weighted" -sgn 1.0 -v $Vgs -i $Ids -y $adgs -id "SUM" -smooth yes
create_variable -name V -dataset RanIV(SUM,$j) -values $IV_SUM(X,$j)
create_variable -name I -dataset RanIV(SUM,$j) -values $IV_SUM(Y,$j)
create_shape -name IV_SUM($j) -dataset RanIV(SUM,$j) -axisX "V" -axisY
"I" 
```

# ifm::GetMOSWeights

Computes the weights for the construction of randomized MOSFET ${ \sf I } _ { { \sf d } } - { \sf V } _ { \sf g }$ curves.

This procedure computes, for each bias point, a weight between 1 and –1 to indicate that the gate-voltage adjustment method or the drain-current adjustment method is to be used.

For -type IdVg_weighted, the weights are set to 1 or –1 depending on the sign of the derivative of the transconductance.

For -type IdVg_SSweighted, the weights are computed as:

$$
W = \operatorname {e r f} \left(\frac {s s - S S}{d s s}\right) \tag {30}
$$

where is the subthreshold slope, and is the user-defined switch-over threshold. TheSS ss smoothness of the transition is set by the user-defined normalization parameter .dss

# Syntax

```txt
ifm::GetMOSWeights -out <list_name> -y <list_of_r> [-type IdVg_weighted | IdVg_SSweighted] [-i <list_of_r> -ss <r> -dss <r>] [-help 0 | 1] 
```

```txt
Argument Description   
-out Name of a list to store the computed weights. (List name, no default)   
-y List containing the relevant reference Y-matrix values. (List of real numbers, no default)   
-type IdVg_weighted | Selects the method used for the computation of the weights. IdVg_SSweighted Default:IdVg_weighted   
-i List containing the reference current values. (List of real numbers, only needed for IdVg_SSweighted)   
-ss Subthreshold slope inflection point in mV/decade. (Real, only needed for IdVg_SSweighted) 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-dss &lt;r&gt;</td><td>Width of transition region in mV/decade. (Real, only needed for IdVg_SSweighted)</td></tr><tr><td>-help 0 | 1</td><td>Prints a help screen if set to 1. Default: 0</td></tr></table>

# Returns

None.

# Example

```tcl
load_file mos_ac_des.plt -name Data(AC)  
set adgs [get_variable_data a(ndrain,ngate) -dataset Data(AC)]  
ifm::GetMOSWeights -out Ws -y $adgs  
create_variable -name W -dataset Data(AC) -values $Ws  
create_plot -ld -name Weights  
selectplots Weights  
createcurve -name W -dataset Data(AC) -axisX "v(ngate)" -axisY "W"  
createcurve -name Y -dataset Data(AC) -axisX "v(ngate)" \ -axisY2 "a(ndrain,ngate)" 
```

# ifm::GetNoiseStdDev

Computes the drain current $\sigma ( I _ { d } )$ and the gate voltage $\sigma ( V _ { g } )$ standard deviation from the drain current noise spectral density $S _ { d , d }$ (see Sentaurus™ Device User Guide, Chapter 23), and the gate-to-drain admittance :yd g, $y _ { d , g }$

$$
\sigma \left(I _ {d}\right) = \sqrt {S _ {d , d} \cdot 1 \mathrm {H z}} \tag {31}
$$

$$
\sigma \left(V _ {g}\right) = \frac {\sqrt {S _ {d , d} \cdot 1 \mathrm {H z}}}{y _ {d , g}} \tag {32}
$$

# Syntax

```txt
ifm::GetNoiseStdDev -out <array_name> -s <list_of_r> -y <list_of_r> [-help 0 | 1] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-out &lt;array_name&gt;</td><td>Name of an array to store the results. The array has one string-valued index. The index contains the elements I and v. 
The value of the I element is a list with the current standard deviations. 
The value of the v element is a list with the voltage standard deviations. 
(Array name, no default)</td></tr><tr><td>-s &lt;list_of_r&gt;</td><td>List containing the current noise spectral density values. 
(List of real numbers, no default)</td></tr><tr><td>-y &lt;list_of_r&gt;</td><td>List containing the relevant reference Y-matrix values. 
(List of real numbers, no default)</td></tr><tr><td>-help 0 | 1</td><td>Prints a help screen if set to 1. Default: 0</td></tr></table>

# Returns

None.

# Example

```tcl
load_file "mos_ac_des.plt" -name Data(AC)  
set adgs [get_variable_data a(ndrain,ngate) -dataset Data(AC)]  
set S_Ids(noise) [get_variable_data S_I(ndrain) -dataset Data(AC)]  
ifm::GetNoiseStdDev -out sigIV -s $S_Ids(noise) -y $adgs  
create_plot -ld -name Sig  
create_variable -name sigId(noise) -dataset Data(AC) -values $sigIV(I)  
createcurve -name sigId(noise) -dataset Data(AC) \  
-axisX "v(ngate)" -axisY "sigId(noise)"  
create_variable -name sigVg(noise) -dataset Data(AC) -values $sigIV(V)  
createcurve -name sigVg(noise) -plot Sig -dataset Data(AC) \  
-axisX "v(ngate)" -axisY2 "sigVg(noise)" 
```

# ifm::GetQQ

Compares the quantiles of a given data distribution with the quantiles of a Gaussian distribution.

For each value in the quantiles of the Gaussian distribution, the matching (interpolated) value of the data distributions is found. Then, the data x-values corresponding to this match are plotted against the normalized Gaussian x-values $( x - \mu ) / \sigma$ .

# Syntax

```txt
ifm::GetQQ -out <array_name> -dq <array_name> -gq <array_name>  
-moments <array_name> [-help 0 | 1] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-out</td><td>Name of an array to store the results. The array has one string-valued index, which contains the elements x and y. The values of these elements represent the lists of x- and y-values of a quantile-quantile comparison curve.(Array name, no default)</td></tr><tr><td>-dq</td><td>Name of arrays containing the quantiles of the given data distribution (dq) and the quantiles of a corresponding Gaussian distribution (gg).The arrays dq and gg each have one string-valued index, which contains the elements x and y. The values of these elements represent the lists of x- and y-values of the quantiles. (Array name, no default)</td></tr><tr><td>-gq</td><td>Name of an array with one string-valued index, which contains the elements norm, ave, and std_dev. The values of these elements contain the requested norm, the average, and the standard deviation of the Gaussian.(Array name, no default)</td></tr><tr><td>-moments</td><td>Prints a help screen if set to 1. Default: 0</td></tr><tr><td>-help 0 | 1</td><td></td></tr></table>

# Returns

None.

# Example

```batch
set RanVals [list -1.657 0.7661 2.142 1.189 -1.919 -0.6670 -0.1915
0.3662]
ifm::GetDataQuantiles -out DataQ -rvs $RanVals
ifm::GetMoments -out Moments -rvs $RanVals 
```

```tcl
ifm::GetGaussian -out GaussianQ -type q -moments Moments \
-nsam 40 -xmin -3.5 -xmax 3.5
ifm::GetQQ -out QQ -dq DataQ -gq GaussianQ -moments Moments
create_plot -ld -name QQplot
selectplots QQplot
create_variable -name "QQX" -dataset QQXY -values $QQ(X)
create_variable -name "QQY" -dataset QQXY -values $QQ(Y)
createCurve -name qq -dataset QQXY -axisX "QQX" -axisY "QQY" 
```

# ifm::GetsIFMStdDev

Computes the drain current and the gate voltage standard deviation from the sIFM linear current responses and the gate-to-drain admittance.

For each bias point in the sIFM data file, this procedure reads the linear current responses and calls ifm::GetMoments to compute the drain current standard deviation $\sigma ( I _ { d } )$ . The gate voltage $\underset { . . } { \sigma } ( V _ { g } )$ standard deviation is obtained by dividing the drain current standard deviation by the gate-to-drain admittance .yd g, $y _ { d , g }$

This procedure also supports the computation of the drain-current and the gate-voltage standard deviation for contact resistance variability.

# Syntax

```rust
ifm::GetsIFMStdDev -out <array_name> -sIFM <string> -y <list_of_r> [-rsig <r> -ydd <list_of_r> -i <list_of_r>] [-help 0 | 1] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-out &lt;array_name&gt;</td><td>Name of an array to store the results. The array has one string-valued index. The index contains the elements I and v. The value of the I element is a list with the current standard deviations. The value of the v element is a list with the voltage standard deviations. (Array name, no default)</td></tr><tr><td>-sIFM &lt;string&gt;</td><td>Name of a comma-separated value (CSV) file containing the sIFM linear current responses. If this string is set to "crv" the contact resistance variability is computed instead. (String, no default)</td></tr><tr><td>-y &lt;list_of_r&gt;</td><td>List containing the relevant reference Y-matrix values. (List of real numbers, no default)</td></tr><tr><td>-rsig &lt;r&gt;</td><td>Standard deviation of contact resistance variability in Ohm. Activated when sIFM is set to "crv". (Real, only needed for contact resistance variability)</td></tr><tr><td>-ydd &lt;list_of_r&gt;</td><td>List containing the reference Y(d,d) matrix elements. Activated when sIFM is set to "crv". 
(List of real numbers, only needed for contact resistance variability)</td></tr><tr><td>-i &lt;list_of_r&gt;</td><td>List containing the reference current values. Activated when sIFM is set to "crv". (List of real numbers, only needed for contact resistance variability)</td></tr><tr><td>-help 0 | 1</td><td>Prints a help screen if set to 1. Default: 0</td></tr></table>

# Returns

None.

# Example

```tcl
load_file "mos_ac_des.plt" -name Data(AC)  
set adgs [get_variable_data a(ndrain,ngate) -dataset Data(AC)]  
ifm::GetsIFMStdDev -out sigIV -sIFM "mos_rdf_I_ndrain.csv" -y $adgs  
create_plot -ld -name Sig  
set_plot_prop -plot Sig -title "Standard Deviations"  
create_variable -name sigId(stat) -dataset Data(AC) -values $sigIV(I)  
createcurve -name sigId(stat) -dataset Data(AC) \  
-axisX "v(ngate)" -axisY "sigId(stat)"  
create_variable -name sigVg(stat) -dataset Data(AC) -values $sigIV(V)  
createcurve -name sigVg(stat) -dataset Data(AC) \  
-axisX "v(ngate)" -axisY2 "sigVg(stat)"
```

# ifm::GetSNM

Computes the static noise margins (SNMs) from butterfly curves for one or more randomization sources.

This procedure takes as input the voltage transfer characteristics (VTC) curves of the left and the right inverters of an SRAM cell. One plot of all VTC curves is known as a butterfly curve. The left (right) SNM is defined as the axis-aligned biggest square that can be fitted into the left (right) lob of the butterfly curve. The effective SNM is defined as the smaller value of the two.

# Syntax

```perl
ifm::GetSNM -out <array_name> -squares <array_name> -vtc_left <array_name> -vtc_right <array_name> -ncol <var_name> [-info 0 | 1 | 2 | 3] [-help 0 | 1] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-out</td><td>Name of a string-indexed array to store the results. The elements are left, right, and eff for the left, right, and effective SNMs. Each array entry contains a list of the respective SNM values for all randomizations. 
(Array name, no default)</td></tr><tr><td>-squares</td><td>Name of a three-indexed array to store the fitted squares representing the SNM in the butterfly curve. 
The first index is integer valued. The elements are 1 or 2 for the square of the left or right lob of the butterfly curve. 
The second index is string valued. The elements are x or y for the x-values and y-values of the fitted square. 
The third index is integer valued and represents the randomization index. 
(Array name, no default)</td></tr><tr><td>-vtc_left</td><td>Names of two-indexed arrays containing the left and right VTC curves.</td></tr><tr><td>(array_name&gt;,</td><td>The first index is string valued. The elements are Header or Data, where the Header contains the names of the columns, such as Vi(0).</td></tr><tr><td>-vtc_right</td><td>The corresponding Data field contains a list of voltage values.</td></tr><tr><td>(array_name&gt;</td><td>The second index is integer valued and represents the randomization index. (Array name, no default)</td></tr><tr><td>-ncol</td><td>Name of a variable containing the number of randomizations in the VTC data. (Variable name, no default)</td></tr><tr><td>-info 0 | 1 | 2 | 3</td><td>Sets local information level. Default: 0</td></tr><tr><td>-help 0 | 1</td><td>Prints a help screen if set to 1. Default: 0</td></tr></table>

# Returns

None.

# Example

```tcl
ifm::ReadCSV -out VTC_L -file Left_VTC.csv -ncol Ncol  
ifm::ReadCSV -out VTC_R -file Right_VTC.csv -ncol Ncol  
set j 42  
set i_in [expr 2*$j]  
set i_ot [expr 2*$j+1] 
```

```powershell
create_variable -name Vi($j) -dataset VTC(L) -values $VTC_L(Data,$i_in)
```

create_variable -name Vo( $j) -dataset VTC(L) -values$ VTC_L(Data,$i_ot) create Curve -name VTC(L, $j) -dataset VTC(L) -axisX "Vi($ j)" \ -axisY "Vo(\$j)"   
create_variable -name Vi( $j) -dataset VTC(R) -values$ VTC_R(Data,$i_ot) create_variable -name Vo(\$j) -dataset VTC(R) -values \)VTC_R(Data,$i_in) create Curve -name VTC(R,\(j) -dataset VTC(R) -axisX "Vi(\$j)" \ -axisY "Vo(\$j)"   
ifm::GetSNM -out SNM -squares SQ -vtc_left VTC_L -vtc_right VTC_R \ -ncol Ncol   
create_variable -name SQ1_x( $j) -dataset SQs -values$ SQ(1,X, $j) create_variable -name SQ1_y($ j) -dataset SQs -values \)SQ(1,Y, $j) create_variable -name SQ2_x($ j) -dataset SQs -values \$SQ(2,X, $j) create_variable -name SQ2_y($ j) -dataset SQs -values \$SQ(2,Y,\(j)   
createCurve -name SQ1( $j) -dataset SQs -axisX "SQ1_x($ j)" \ -axisY "SQ1_y(\$j)"   
createCurve -name SQ2( $j) -dataset SQs -axisX "SQ2_x($ j)" \ -axisY "SQ2_y(\$j)"   
puts "Left SNM: [lindex \$SNM(left) \$j]"   
puts "Right SNM: [lindex \$SNM(right) \$j]"   
puts "Effective SNM: [lindex \$SNM(eff) \$j]"

# ifm::GetSRAMVTC

Constructs randomized VTC curves for an SRAM cell for one or more randomization sources.

To compute the randomized VTC of an inverter from an SRAM cell, a method similar to the weighted method outlined in ifm::GetMOSIVs on page 478 for the single transistor is used. Unlike in a single transistor, in an SRAM cell, the output node is not connected to an external voltage source and, therefore, Kirchhoff’s law requires that $d I _ { \mathrm { v } , o } = 0$ .

For the extraction of SRAM SNMs, you cannot require that the output small-signal voltage variation vanishes because, during the read operation of the SRAM cell (access transistor is switched on) in the region of low output bias (PMOS transistor is switched off), the actual voltage of the output node is defined by the voltage divider formed by the access transistor and the NMOS transistor. The current flow fluctuations through the access transistor cannot be adequately compensated by adjusting the gate voltage of the NMOS (and PMOS) transistor. A solution for the -th randomized SRAM cell for which all currents through theν inverters are the same, as in the reference SRAM cell, while additionally requiring that the voltage at the output is also the same in the reference inverter would not be physical. For example, for certain bias conditions, unrealistically large gate voltage adjustments would be needed to overcompensate the random dopant fluctuation effects in the access transistor.

To obtain physically relevant VTC curves, both the output and input voltages are adjusted:

$$
\delta I _ {\mathrm {v}, o} = - y _ {o, i} d V _ {\mathrm {v}, i} - y _ {o, o} d V _ {\mathrm {v}, o} \tag {33}
$$

A method, which results in physical VTC curves, consists of adjusting both and dVν, i dVν, o $d V _ { \mathrm { v } , i }$ $d V _ { \mathrm { v } , o }$ based on an automatic analysis of the current flow in the reference device. For this method, the voltage variations $d V _ { \mathrm { v } , i }$ and $d V _ { \mathrm { v } , o }$ are expressed in terms of voltage variations in the coordinate system that is rotated:

$$
\left[ \begin{array}{l} d V _ {\mathrm {v}, o} \\ d V _ {\mathrm {v}, i} \end{array} \right] = \left[ \begin{array}{l l} \cos (\varphi) & \sin (\varphi) \\ - \sin (\varphi) & \cos (\varphi) \end{array} \right] \left[ \begin{array}{l} d V _ {\mathrm {v}, 1} \\ d V _ {\mathrm {v}, 2} \end{array} \right] \tag {34}
$$

In the rotated coordinate system, the boundary condition is imposed such that $d V _ { \mathrm { v } , 1 } = 0$ , resulting in:

$$
d V _ {v, 2} = - \frac {\delta I _ {v , o}}{y _ {o , i} \sin (\varphi) + y _ {o , o} \cos (\varphi)} \tag {35}
$$

At each bias point, an angle is selected that ensures a monotonous and physical solution.

For example, you can find out whether you are in the hold-like inverter regime (access transistor is closed) or in the voltage divider regime (PMOS transistor is closed) by monitoring the current flows in the reference SRAM cell. The reference current through the inverter is the sum of the currents through the PMOS and the access transistors. If the main contribution comes from the PMOS device, you are in the hold-like inverter regime, and you set $\boldsymbol { \Phi }$ to $\pi / 2$ . On the other hand, if the main contribution comes from the access transistor, you are in the voltage divider regime, and you set $\boldsymbol { \Phi }$ to 0. Therefore, you can use the reference current to select the appropriate angle and then compute .dVυ, 2 $d V _ { \mathrm { { \upsilon } } , 2 }$

An example of a script to compute the current-controlled angle is:

```tcl
set Ips [get_variable_data "$pSOURCE TotalCurrent" -dataset Data(DC)]  
set Ias [get_variable_data "$aDRAIN TotalCurrent" -dataset Data(DC)]  
foreach Ip $Ips Ia $Ias {  
    set It [expr $Ip + $Ia]  
    lappend fis [expr 0.5*$pi*$Ip/$It]  
} 
```

Here, pSOURCE points to the source contact of the PMOS transistor, and aDRAIN points to the drain contact of the access transistor of the inverters of interest in the SRAM cell.

# Syntax

```perl
ifm::GetSRAMVTC -out <array_name> -vin <list_of_r> -vout <list_of_r> -fi <list_of_r> -aoi <list_of_r> -aoo <list_of_r> -id <string> -sifm <array_name> -nrow <var_name> -ncol <var_name> [-info 0 | 1 | 2 | 3] [-help 0 | 1] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-out</td><td>Name of a two-indexed array to store the constructed VTC curves. The first index is string valued. The elements are Header or Data, where the Header contains the names of the columns, such as Vi (0). The corresponding Data field contains a list of voltage values. The second index is integer valued. It represents the randomization index. (Array name, no default)</td></tr><tr><td>-vin</td><td>List containing the reference VTC input voltage values. (List of real numbers, no default)</td></tr><tr><td>-vout</td><td>List containing the reference VTC output voltage values. (List of real numbers, no default)</td></tr><tr><td>-fi</td><td>List containing the current-controlled angle values. (List of real numbers, no default)</td></tr><tr><td>-aoi</td><td>List containing the reference ReY(out,in) matrix values. (List of real numbers, no default)</td></tr><tr><td>-aoo</td><td>List containing the reference ReY(out,out) matrix values. (List of real numbers, no default)</td></tr><tr><td>-id</td><td>ID of the sIFM variability source. (String, no default)</td></tr><tr><td>-sifm</td><td>Name of an array that contains the sIFM data. The array has three indices: The first index is string valued. The elements are the variability source identifiers. The second index is integer valued and represents the row or bias index. The third index is integer valued and represents the column or randomization index. The array element values contain the sIFM linear current response. (Array name, no default)</td></tr><tr><td>-nrow</td><td>Name of a variable containing the number of rows (bias points) in the sIFM data. (Variable name, no default)</td></tr><tr><td>-ncol</td><td>Name of a variable containing the number of columns (randomizations) in the sIFM data. (Variable name, no default)</td></tr><tr><td>-info 0 | 1 | 2 | 3</td><td>Sets local information level. Default: 0</td></tr><tr><td>-help 0 | 1</td><td>Prints a help screen if set to 1. Default: 0</td></tr></table>

# Returns

None.

# Example

load_file sys_des.plt -name SYSTEM
load_file SRAM_des.plt -name DC
load_file sram_ac_des.plt -name AC
set Vins [get_variable_data v(\(IN) -dataset SYSTEM]
set Vots [get_variable_data v(\)OUT) -dataset SYSTEM]
set aois [get_variable_data a( $OUT,$ IN) -dataset AC]
set aoos [get_variable_data a( $OUT,$ OUT) -dataset AC]
set Ips [get_variable_data "SourceP2 TotalCurrent" -dataset DC]
set Ias [get_variable_data "DrainACC2 TotalCurrent" -dataset DC]
foreach Ip \)Ips Ia $Ias {
set It [expr $IP +$ Ia]
lappend fis [expr 0.5*$ifm::pi*$IP/$It]
}
ifm::ReadsIFM -out sIFM -nrow Nrow -ncol Ncol \
-files "flipL_n12_sram_rdf_I_OR.csv" -ids "rdfs"
ifm::GetSRAMVTC -out VTC -id "rdf" -vin $Vins -vout $Vots \
-fi $fis -aoi $aois -aoo $aoos -sifm sIFM -nrow Nrow -ncol Ncol
create_plot -ld -name RanVTC
selectplots RanVTC
set j 42
set i_in [expr 2*$j]
set i_ot [expr 2*$j+1]
create_variable -name Vi(\(j) -dataset RanVTC(rdf) -values
$VTC(Data,\(i_in)
create_variable -name Vo(\)j) -dataset RanVTC(rdf) -values
$VTC(Data,\(i_ot)
createCurve -name VTC(\)j) -dataset RanVTC(rdf) \
-axisX "Vi( $j)" -axisY "Vo($ j)"

# ifm::ReadCSV

Reads a CSV file, and passes the read data to the calling program in the form of a Tcl array.

# Note:

The CSV files are assumed to have the following format: one header line containing the names of the datasets (no spaces) followed by a number of rows containing the values in the dataset. For example:

-1.11e-12,3.92e-14,-1.66e-13,-6.09e-13,... (no spaces)

# Syntax

```txt
ifm::ReadCSV -out <array_name> -file <string> -ncol <var_name> [-info 0 | 1 | 2 | 3] [-help 0 | 1] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-out</td><td>Name of an array with two indices to store the read data. The first index is string valued and contains the elements Header and Data. The second index is integer valued and enumerates the number of columns in the CSV file. The values of the Header elements are the dataset names. The values of the Data elements contain lists with the values in the dataset. (Array name, no default)</td></tr><tr><td>-file</td><td>Name of the CSV file to be read. (String, no default)</td></tr><tr><td>-ncol</td><td>Name of a variable containing the number of columns found in the CSV file. (Variable name, no default)</td></tr><tr><td>-info 0 | 1 | 2 | 3</td><td>Sets local information level. Default: 0</td></tr><tr><td>-help 0 | 1</td><td>Prints a help screen if set to 1. Default: 0</td></tr></table>

# Returns

# None.

# Example

```csv
set Ncol 3  
set CSV(Header,0) "A"  
set CSV(Header,1) "B"  
set CSV(Header,2) "C"  
set CSV(Data,0) [list 1.1 1.2 1.3 1.4] 
```

```tcl
set CSV(Data,1) [list 2.1 2.2 2.3 2.4]
set CSV(Data,2) [list 3.1 3.2 3.3 3.4]
ifm::WriteCSV -csv CSV -ncol Ncol -file "my.csv"
ifm::ReadCSV -out ReadCSV -ncol ReadNcol -file "my.csv"
for {set icol 0} {\(icol < \)ReadNcol} {incr icol} {
puts "Column name is: $ReadCSV(Header, \)icol)" puts "Column data is: $ReadCSV(Data, \)icol)" }
Column name is: A
Column data is: 1.1 1.2 1.3 1.4
Column name is: B
Column data is: 2.1 2.2 2.3 2.4
Column name is: C
Column data is: 3.1 3.2 3.3 3.4 
```

# ifm::ReadsIFM

Reads one or more sIFM CSV files containing the linear current responses, and passes the read data to the calling program in the form of a Tcl array.

This procedure also supports the computation of the linear current responses for contact resistance variability.

# Note:

The CSV files are assumed to have the following format: one header line containing the names of the datasets (no spaces) followed by a number of rows containing the values in the dataset. For example:

-1.11e-12,3.92e-14,-1.66e-13,-6.09e-13,... (no spaces)

# Syntax

```perl
ifm::ReadsIFM -out <array_name> -files <list_of_strings>  
-ids <list_of_strings> -nrow <var_name> -ncol <var_name>  
[-rsig <r> -nrand <i> -rseed <i> -ydd <list_of_r>] -i <list_of_r>  
[-info 0 | 1 | 2 | 3] [-help 0 | 1] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-out</td><td>Name of an array to store the read data. The array has three indices:</td></tr><tr><td></td><td>The first index is string valued. The elements are the variability source identifiers.</td></tr><tr><td></td><td>The second index is integer valued and represents the row or bias index.</td></tr><tr><td></td><td>The third index is integer valued and represents the column or randomization index.</td></tr><tr><td></td><td>The array element values contain the sIFM linear current response. (Array name, no default)</td></tr><tr><td>-files</td><td>List containing the names of the sIFM CSV data files. (List of strings, no default)</td></tr><tr><td>-ids</td><td>List containing the variability source identifiers. If the list contains the special identifier SUM, the combined data from all variability sources will also be computed. (List of strings, no default)</td></tr><tr><td>-nrow</td><td>Name of a variable to store the number of rows (bias points) found in the sIFM CSV file. (Variable name, no default)</td></tr><tr><td>-ncol</td><td>Name of a variable to store the number of columns (randomizations) found in the sIFM CSV file. (Variable name, no default)</td></tr><tr><td>-rsig</td><td>Standard deviation of contact resistance variability in Ohm. Activated when ids contains "crv". (Real, only needed for contact resistance variability)</td></tr><tr><td>-nrand</td><td>Number of random samples. Activated when ids contains "crv". (Integer, only needed for contact resistance variability)</td></tr><tr><td>-rseed</td><td>Random number seed. Activated when ids contains "crv". (Integer between 1 and 2147483647; only needed for contact resistance variability)</td></tr><tr><td>-ydd</td><td>List containing the reference Y(d,d) matrix elements. Activated when ids contains "crv". (List of real numbers, only needed for contact resistance variability)</td></tr><tr><td>-i</td><td>List containing the reference current values. Activated when ids contains "crv". (List of real numbers, only needed for contact resistance variability)</td></tr><tr><td>-info 0 | 1 | 2 | 3</td><td>Sets local information level. Default: 0</td></tr><tr><td>-help 0 | 1</td><td>Prints a help screen if set to 1. Default: 0</td></tr></table>

# Returns

None.

# Example

```txt
set IDs [list rdf ifft SUM]  
set FILES [list rdf_I_ndrain.csv ifft_I_ndrain.csv SUM_I_ndrain.csv]  
ifm::ReadsIFM -out sIFM -nrow Nrow -ncol Ncol -files $FILES -ids $IDs  
puts "The linear drain current response due to random dopant fluctuations in the 42th randomization at 12th bias point is: sIFM(rdf,12,42) = $sIFM(rdf,12,42). The corresponding response to interface traps is sIFM(ift,12,42) = $sIFM(ift,12,42). The combined response is sIFM(SUM,12,42) = $sIFM(SUM,12,42)" 
```

# Note:

The CSV file associated with the SUM ID is not actually read and, therefore, it does not have to exist. The actual dataset is computed automatically by summing all previously read datasets.

# ifm::WriteCSV

Writes a Tcl array to a CSV file.

# Syntax

```txt
ifm::WriteCSV -file <string> -csv <array_name> -ncol <var_name> [-info 0 | 1 | 2 | 3] [-help 0 | 1] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-file &lt;string&gt;</td><td>Name of a CSV file to be written. (String, no default)</td></tr><tr><td>-csv &lt;array_name&gt;</td><td>Name of an array with two indices, containing the data to be written. The first index is string valued and contains the elements Header and Data. The second index is integer valued and enumerates the number of columns in the CSV file. The values of the Header elements are the dataset names. The values of the Data elements contain lists with the values in the dataset. (Array name, no default)</td></tr><tr><td>-ncol &lt;var_name&gt;</td><td>Name of a variable containing the number of columns in the CSV data to be written. (Variable name, no default)</td></tr><tr><td>-info 0 | 1 | 2 | 3</td><td>Sets local information level. Default: 0</td></tr><tr><td>-help 0 | 1</td><td>Prints a help screen if set to 1. Default: 0</td></tr></table>

# Returns

None.

# Example

```txt
set Ncol 3  
set CSV(Header,0) "A"  
set CSV(Header,1) "B"  
set CSV(Header,2) "C"  
set CSV(Data,0) [list 1.1 1.2 1.3 1.4]  
set CSV(Data,1) [list 2.1 2.2 2.3 2.4]  
set CSV(Data,2) [list 3.1 3.2 3.3 3.4]  
ifm::WriteCSV -csv CSV -ncol Ncol -file "my.csv" 
```

# lib::SetInfoDef

Sets the default information level.

# Note:

Level 0: Warning, error, or status messages only.

Level 1: Echo results.

Level 2: Show progress and some debug information.

Level 3: Show all debug information.

The local information level also can be set using the -info keyword of the procedures in the IFM library.

# Syntax

lib::SetInfoDef 0 | 1 | 2 | 3

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;info_level&gt;</td><td>Sets the default information level. Default: 0</td></tr></table>

# Returns

None.

# Example

lib::SetInfoDef 2

# H

# HTwo-Port Network RF Extraction Library

This appendix provides information about the procedures of the RF extraction library.

Under the assumption that a transistor can be modeled by a two-port network, the procedures of the two-port network radio frequency (RF) extraction library are used to compute:

• RF parameters from AC analysis data.   
• Noise parameters from noise analysis data.

The functionality of the RF extraction library includes:

RF matrix conversion: Converting an admittance (Y-)matrix to a hybrid (h-)matrix, a scattering (S-)matrix, and an impedance (Z-)matrix.   
Plotting the small-signal data (conductance, capacitance, and RF parameters). In addition to rectangular plots, polar plots and Smith charts are supported.   
Plotting the following noise spectral densities (NSDs) or power spectral densities (PSDs) of various representations (noise equivalent circuits) of a noisy transistor:

◦ Noise voltage spectral density (NVSD) for impedance representation.   
◦ Noise current spectral density (NISD) for admittance representation.

• RF parameter extraction:

◦ Computing small-signal current gain, stability criteria such as the Rollett stability factor and the stability condition delta, various power gains such as maximum available gain (MAG), maximum stable gain (MSG), Mason’s unilateral gain (MUG), and unilateral figure of merit.   
Extracting transistor figures of merit such as cutoff frequency, maximum frequency of oscillation, and cutoff frequency for stability.

• Noise parameter extraction:

◦ Computing PSDs of the equivalent input noise generators in chain representation of a noisy transistor.   
◦ Computing the noise figure of a transistor.   
◦ Extracting various noise parameters of a transistor such as the minimum noise figure, the equivalent noise resistance and conductance, and the optimum source admittance and impedance.

• Complex arithmetic support (both scalar and vectorial versions).   
• Exporting data in comma-separated value (CSV) file format.

The RF extraction library is loaded with the command:

load_library rfx

# Syntax Conventions

The RF extraction library uses a unique namespace identifier $\left( \mathrm { r f } \mathbf { x } \colon : \right)$ for its procedures. All procedures and variables associated with this library are called with the namespace identifier prepended. For example:

rfx::<proc_name>

Each procedure has several arguments. The RF extraction library uses an input parser that accepts arguments of the form:

-keyword <value>

# Note:

All Sentaurus Visual libraries support the standard Sentaurus Visual syntax in which keywords are preceded by a dash. For backward compatibility, all Sentaurus Visual libraries continue to support the keyword $=$ <value> syntax as well. For each procedure call, you can use either the -keyword <value> syntax or the keyword $=$ <value> syntax. However, within any one procedure call, only one type of syntax can be used. Otherwise, an error message will be generated. Only the new syntax is documented. If you want to continue using the keyword $=$ <value> syntax, you also can insert space between the keyword and the equal sign, for example, keyword $=$ <value>. Omitting the space between the equal sign and the value field will result in a failure if the value is a de-referenced Tcl variable. Use keyword $=$ $val (not keyword=$val).

The parser accepts arguments in any order. For some arguments, default values are predefined. Such arguments can be omitted. If arguments for which no defaults are

predefined are omitted, the procedure will exit with an error message. In addition, unrecognized arguments result in an error message.

Instead of using the standard Tcl method of using the return value of the procedure to pass results back to the calling program, the RF extraction library uses a passing-by-reference method to return the results to the calling program. The procedure keyword -out is used to pass the results back to the calling program:

```txt
-out <var_name>, <list_name>, or <array_name> 
```

The following conventions are used for the syntax of Tcl commands:

Angle brackets – <> – indicate text that must be replaced, but they are not part of the syntax. In particular, the following type identifiers are used:   
◦ <r>: Replace with a real number, or a de-referenced Tcl variable that evaluates to a real number. For example: $val.   
◦ <i>: Replace with an integer, or a de-referenced Tcl variable that evaluates to an integer. For example: $\$ 1$ .   
◦ <string>: Replace with a string, or a de-referenced Tcl variable that evaluates to a string. For example: $file.   
◦ <list_of_r>: Replace with a list of real numbers, or a de-referenced Tcl variable that evaluates to a list of real numbers. For example: $values.   
◦ <list_of_strings>: Replace with a list of strings, or a de-referenced Tcl variable that evaluates to a list of strings. For example: $files.   
◦ <var_name>: Replace with the name of a local Tcl variable. For example: val (not $val).   
◦ <list_name>: Replace with the name of a local Tcl list. For example: values (not $values).   
◦ <array_name>: Replace with the name of a local Tcl array. For example: myarray (not $myarray).   
◦ <dataName>: Replace with the name of a dataset.   
◦ <fileName>: Replace with the name of a file, or a de-referenced Tcl variable that evaluates to the name of a file.   
◦ <plotName>: Replace with the name of a plot.   
• Brackets – [] – indicate that the argument is optional, but they are not part of the syntax.   
• A vertical bar – | – indicates options, only one of which can be specified.

# Help for Procedures

To request help on a specific procedure, in Tcl mode, set the -help keyword to 1:

rfx::<procedure_name> -help 1

If this command is included in a Sentaurus Visual file, when Sentaurus Visual is executed in:

Batch mode in Sentaurus Workbench, the help information is printed to the runtime output file (with the extension .out) of the corresponding Sentaurus Visual node.   
Interactive mode in Sentaurus Workbench, the help information is displayed in the Tcl Console as well as printed in the Sentaurus Visual runtime output file.

You also can enter the command in the Tcl Console of the user interface, in which case, the help information is displayed in the Console.

# Output of Procedures

As discussed in Syntax Conventions on page 501, all procedures of the RF extraction library pass the results back to the calling program by storing the results in a Tcl variable. The name of this Tcl variable is specified as the value of the -out keyword.

If there are errors in the RF extraction library procedures, the behavior of Sentaurus Visual depends on whether it is executed in batch mode or interactive mode in Sentaurus Workbench. In batch mode, Sentaurus Visual exits and an error message is printed only in the Sentaurus Visual error file (with the extension .err). In interactive mode, the error message is displayed in the Tcl Console as well as printed in the Sentaurus Visual runtime error file.

All procedures also print several messages (including warning messages). If Sentaurus Visual is executed in batch mode, the messages are printed only in the Sentaurus Visual output file; whereas, in interactive mode, the messages are displayed in the Tcl Console as well as printed in the Sentaurus Visual runtime output file.

The amount of information printed depends on the information level specified by the procedure lib::SetInfoDef.

# Overview of RF Extraction Library Procedures

For the simulation of RF characteristics and the extraction of RF parameters, small-signal (AC) analysis is performed in Sentaurus Device by varying the bias at a contact and performing a frequency sweep at each bias point. The Sentaurus Device AC data file contains the conductance values $a _ { i j }$ and capaci tance values $c _ { i j }$ at each bias and frequency

point for all contact-to-contact combinations included in the small-signal analysis (see A-Matrix, C-Matrix, and Y-Matrix on page 506). The RF extraction library assumes that the transistor can be modeled by a two-port network as shown in Figure 141.

The functionality of the RF extraction library and the corresponding procedures are:

• Loading the Sentaurus Device AC data file, and creating a Y-matrix and PSD matrices:

The Sentaurus Device AC data file is loaded in Sentaurus Visual using the rfx::Load procedure, which creates the Tcl array rfx::AC containing the conductance and capacitance values (see rfx::Load on page 547). This data also is converted to admittance or Y-parameters, and the Y-parameters or the Y-matrix are stored in the Tcl array rfx::Y. The rfx::Load procedure also creates the PSD Tcl arrays (corresponding to PSD matrices) and other variables that are summarized in Table 37 on page 523. For details about these arrays, see A-Matrix, C-Matrix, and Y-Matrix on page 506 and Power Spectral Density Matrices on page 507.

• Converting a Y-matrix to other matrices:

The Y-matrix is converted to either an h-matrix, an S-matrix, or a Z-matrix (see Matrix Conversions on page 513) using the matrix conversion procedures rfx::Y2H (see rfx::Y2H on page 556), rfx::Y2S (see rfx::Y2S on page 557), and rfx::Y2Z (see rfx::Y2Z on page 558), respectively. All these matrices are complex and the matrix conversion procedures internally use the complex arithmetic procedures (see Complex Arithmetic Support on page 559). The RF parameters $Y _ { i j }$ , $h _ { i j }$ , $S _ { i j }$ , and $Z _ { i j }$ are the elements of the Y-, h-, S-, and Z-matrix, respectively.

• Creating Sentaurus Visual datasets containing small-signal data and noise analysis data:

Sentaurus Visual datasets containing the small-signal data $( a _ { i j } , c _ { i j } , Y _ { i j } , h _ { i j } , S _ { i j }$ , or $Z _ { i j }$ ) as a function of frequency or bias can be created using the procedure rfx::CreateDataset (see rfx::CreateDataset on page 526). The datasets corresponding to the RF parameters contain the real and imaginary parts, as well as the absolute value and the phase of the RF parameters. The absolute value of these parameters also can be computed in units of decibel (dB). In addition, Sentaurus Visual datasets containing noise analysis data $\mathrm { \nabla } \cdot \mathrm { S _ { V } ^ { \it t J } }$ and $S _ { \mathrm { { I } } } ^ { l J }$ ) can be created using the rfx::CreateDataset procedure.

• Plotting small-signal data and noise analysis data:

The datasets created using the rfx::CreateDataset procedure can be used to visualize the small-signal data and noise analysis data as a function of frequency or bias. The RF parameters can be visualized using the following types of plot:

◦ Rectangular plots using Sentaurus Visual commands   
Polar plots using the rfx::PolarBackdrop procedure (see rfx::PolarBackdrop on page 551)

◦ Smith charts using the rfx::SmithBackdrop procedure (see rfx::SmithBackdrop on page 555)

• Computing power gains and stability criteria:

Various power gains and stability criteria are computed using S-parameters (see Gains, Amplifier Stability, and Unilateralization on page 514) using the rfx::GetPowerGain procedure (see rfx::GetPowerGain on page 544). This procedure also can be used to create datasets containing the power gains and stability criteria, either as a function of frequency or bias.

• Extracting transistor figures of merit:

The transistor figures of merit such as cutoff frequency, maximum frequency of oscillation, and cutoff frequency for stability (see Transistor Figures of Merit on page 516) can be extracted using the procedures rfx::GetFt (see rfx::GetFt on page 536), rfx::GetFmax (see rfx::GetFmax on page 534), and rfx::GetFK1 (see rfx::GetFK1 on page 532). These procedures can be used to create the datasets containing the extracted figures of merit as a function of bias. The first two procedures also can be used to create datasets containing the derivative of the gain as a function of frequency.

• Extracting transistor noise parameters:

Transistor noise parameters such as the minimum noise figure, the equivalent noise resistance and conductance, and the optimum source admittance and impedance, along with other noise parameters and noise figures (see Noise Figure of a Linear Two-Port Network on page 519), can be extracted using the rfx::GetNoiseFigure procedure (see rfx::GetNoiseFigure on page 540). This procedure can create datasets containing the extracted noise parameters as a function of frequency or bias.

• Exporting small-signal data:

The small-signal data can be exported to a CSV file using the rfx::Export procedure (see rfx::Export on page 531).

# Equations Used in RF Extraction Library

This section discusses the equations used in the RF extraction library.

# A-Matrix, C-Matrix, and Y-Matrix

The Sentaurus Device AC data file contains the conductance matrix (A-matrix, ) and theA capacitance matrix (C-matrix, $C$ ) for each bias $( \nu )$ and frequency $( f )$ point for all contact-to-contact combinations included in the small-signal analysis. The rows and columns of these matrices are given by the nodes included in the small-signal analysis.

For a 3D device, the Sentaurus Device AC data file contains the following for each frequency and bias point:

• $a _ { i j }$ , the coefficients or elements of the A-matrix   
$c _ { i j }$ , the coefficients or elements of the C-matrix

The A-matrix and C-matrix are converted to an admittance matrix (Y-matrix, ) using:Y

$$
Y = A + j \omega C = A + j B \tag {36}
$$

where:

• $j$ is the imaginary unit.   
• $\omega = 2 \pi f$ is the angular frequency.   
• Matrix $B$ is the susceptance matrix, with coefficients $b _ { i j }$

The RF extraction library assumes that the transistor can be modeled by a two-port network as shown in Figure 141. Therefore, the RF extraction library reads only a $^ { 2 \times 2 }$ matrix, corresponding to a two-port network setup. If other ports are present, they are ignored.

![](images/1e780faadbbcca6af7b64a8a9821fcbeff7c224d272d5431393e8e1bc8000890.jpg)  
Figure 141 Two-port network schematic

For a two-port network, the complex Y-matrix at a particular frequency $f$ and bias point v is represented by:

$$
Y = \left[ \begin{array}{l l} Y _ {1 1} (f, \mathrm {v}) & Y _ {1 2} (f, \mathrm {v}) \\ Y _ {2 1} (f, \mathrm {v}) & Y _ {2 2} (f, \mathrm {v}) \end{array} \right] \tag {37}
$$

where the elements of the Y-matrix, $Y _ { i j }$ , are the admittance (Y-)parameters. The real and imaginary parts of the complex Y-parameters are given by:

$$
\Re \left(Y _ {i j} (f, \mathrm {v})\right) = a _ {i j} (f, \mathrm {v}) \tag {38}
$$

$$
I \left(Y _ {i j} (f, \mathrm {v})\right) = b _ {i j} (f, \mathrm {v}) = \omega c _ {i j} (f, \mathrm {v}) \tag {39}
$$

# Tcl Arrays rfx::AC and rfx::Y

When the Sentaurus Device AC data file is loaded in Sentaurus Visual using the procedure rfx::Load, two Tcl arrays rfx::AC and rfx::Y are created (see Table 38 on page 528). Both these arrays are two dimensional and have the same form:

```txt
rfx::AC($ReIm,$P1,$P2,$if,$iv)  
rfx::Y($ReIm,$P1,$P2,$if,$iv)
```

# where:

• ReIm: 0 (real part) or 1 (imaginary part):

◦ For rfx::AC, 0 corresponds to $a _ { i j } ( f , \mathrm { v } )$ and 1 corresponds to $c _ { i j } ( f , \mathrm { v } )$   
◦ For rfx::Y, 0 corresponds to $a _ { i j } ( f , \mathrm { v } )$ and 1 corresponds to $b _ { i j } ( f , \mathrm { v } )$ (Equation 39).

• P1,P2: 1 or 2 (port number)   
• if: 0-(rfx::i_freqend) frequency index   
• iv: 0-(rfx::i_biasend) bias point index

Therefore, the $\mathtt { r f x } \colon : \mathtt { A C }$ array contains the coefficients $\underset { . . } { a } _ { i j } ( f , \mathrm { v } )$ and $c _ { i j } ( f , \mathrm { v } )$ for all frequency and bias points. The $\mathtt { r f x : : Y }$ array contains the coefficients $\overset { \prime } { a } _ { i j } ( f , \mathrm { v } )$ and $b _ { i j } ( f , \mathbf { v } )$ .

To access the small-signal data or the RF parameter for a given bias or frequency, the appropriate array indices (frequency index and bias point index) must be given.

# Power Spectral Density Matrices

The effect of a noisy electronic device on a circuit can be analyzed using either a small-signal model of the device or a two-port network approach. RF extraction library implements noise parameter extraction using the two-port network approach.

A noisy device such as a transistor can be represented by a two-port network with internal noise sources (see Figure 142). For small signals, any noisy two-port network can be replaced by a noise equivalent circuit consisting of a noiseless two-port network and two external equivalent noise sources added to the terminals of the two-port (see Figure 142). The external noise sources are either noise voltage sources or noise current sources, and they produce the same noise voltages at the circuit terminals as the internal noise sources.

# Power Spectral Densities

As shown in Figure 142, there are several equivalent representations of a noisy two-port network depending on the type of the external noise sources and their arrangement relative to the noiseless two-port [1].

![](images/3bb23a2e4c36f18785a129388413503b0e1b36ed12e449f51f94dbb7825995ee.jpg)  
Figure 142 (Upper left) Two-port network with internal noise sources, and noise equivalent circuits of a two-port network: (upper right) admittance representation, (lower left) impedance representation, and (lower right) chain representation

![](images/9853a737fb615472579d5703a0dc1873976f63706e55e438696c0d1e5c593a8f.jpg)

![](images/71a154995c3655c24d330cdc714edcdc6809077652bff8ef89109aa7bf0f87a9.jpg)

![](images/7d9b1ba1df65b7d0623ba0f15e14135357662c762cadc89e21d77195e2ae9456.jpg)

The most commonly used representations are:

Impedance representation: Noise voltage sources $\mathsf { v } _ { \mathsf { n } 1 }$ and $\mathsf { v } _ { \mathsf { n } 2 }$ are placed in series with the input and output terminals (see Figure 142, lower-left image).   
Admittance representation: Noise current sources $\mathsf { i } _ { \mathsf { n } 1 }$ and $\mathsf { i } _ { \mathsf { n } 2 }$ are placed in parallel with the input and output terminals (see Figure 142, upper-right image).   
Chain representation (equivalent input noise representation): Input noise voltage source ${ \mathsf { v } } _ { \mathsf { n } }$ and input noise current source $\mathsf { i } _ { \mathsf { n } }$ are placed at the input terminals (see Figure 142, lower-right image).

The noise sources are characterized by a mean square value and a PSD:

${ \mathsf { v } } _ { \mathsf { n } }$ $\overline { { { \nu } } } _ { n } ^ { 2 }$ and the NVSD $S _ { \nu _ { n } }$ .Svn   
• A noise current source $\mathsf { i } _ { \mathsf { n } }$ is characterized by the mean square value $\overline { { i _ { n } ^ { 2 } } }$ and the NISD $S _ { i _ { n } }$

The NVSD determines the mean square value of the noise voltage source, and the NISD determines the mean square value of the current voltage source within a frequency interval of width 1 Hz [2]. Therefore, the units of NVSD are $V ^ { 2 } / \mathsf { H } z$ or $\vee ^ { 2 } \thinspace \mathsf { s }$ , and the units of NISD are $\mathsf { A } ^ { 2 } / \mathsf { H } z$ or $\mathsf { A } ^ { 2 } \mathsf { s }$ . The PSD gives the average power $P _ { \mathrm { a v } }$ that the noise source contributes in a 1 Hz bandwidth around frequency $f$ . The PSD spectrum shows how much average power the noise source contributes at each frequency [3].

For a noise voltage source, its average power and mean square voltage over a frequency interval $[ f _ { 1 } , f _ { 2 } ]$ are related to its NVSD by:

$$
P _ {\mathrm {a v}} = \overline {{v _ {n} ^ {2}}} = \int_ {f _ {1}} ^ {f _ {2}} S _ {v _ {n}} d f \tag {40}
$$

For a contact pair $( i , j )$ (or for nodes $i$ and $j$ ), the NVSD is denoted by $S _ { \mathrm { V } } ^ { i j }$ , and the NISD is denoted by $\mathrm { \dot { \it S } } _ { \mathrm { I } } ^ { l J }$ . Autocorrelation PSD corresponds to the case when both terminals are the same $( i = j )$ ; whereas, the cross-correlation PSD corresponds to the case when both terminals are different $( i \neq j )$ .

The following PSDs can be defined for the various representations of the noisy two-port (see PSDs Computed by Sentaurus Device and RF Extraction Library on page 510):

$S _ { \mathrm { V } } ^ { 1 1 }$ : Noise voltage spectral density at the input port in the impedance representation.   
$S _ { \mathrm { V } } ^ { 2 2 }$ : Noise voltage spectral density at the output port in the impedance representation.   
$S _ { \mathrm { V } } ^ { 1 2 }$ and $S _ { \mathrm { V } } ^ { 2 1 }$ : Cross-correlation spectral density between the input and output voltage noise sources (impedance representation).   
• $S _ { \mathrm { I } } ^ { 1 1 }$ : Noise current spectral density at the input port in the admittance representation.   
$S _ { \mathrm { I } } ^ { 2 2 }$ : Noise current spectral density at the output port in the admittance representation.   
$S _ { \mathrm { I } } ^ { 1 2 }$ and $S _ { \mathrm { I } } ^ { 2 1 }$ : Cross-correlation spectral density between the input and output current noise sources (admittance representation).   
$S _ { \nu _ { n } }$ : Noise voltage spectral density of the input noise voltage source ${ \mathsf { v } } _ { \mathsf { n } }$ in the chain representation.   
$S _ { i _ { n } }$ : Noise current spectral density of the input noise current source $\mathsf { i } _ { \mathsf { n } }$ in the chain representation.   
$S _ { \nu , \overline { { i } } }$ and : Cross-correlation spectral density of the equivalent input noise voltage S and noise current source (chain representation).vnin invn

The NISDs in the admittance representation are used to compute the noise correlation coefficient between the input and output noise current sources :Ci $C _ { i _ { n } }$

$$
C _ {i _ {n}} = \frac {S _ {\mathrm {I}} ^ {1 2}}{\sqrt {S _ {\mathrm {I}} ^ {1 1} S _ {\mathrm {I}} ^ {2 2}}} \tag {41}
$$

# PSDs Computed by Sentaurus Device and RF Extraction Library

As a result of noise analysis on a two-port network containing nodes i $( i = 1$ , input port) and $j$ $( j = 2$ , output port), Sentaurus Device computes the autocorrelation and cross-correlation spectral densities for both impedance representation $( S _ { \mathrm { V } } ^ { 1 1 } , S _ { \mathrm { V } } ^ { 2 1 }$ , and $S _ { \mathrm { V } } ^ { 2 2 }$ ) and admittance representation $( S _ { \mathrm { I } } ^ { 1 1 } , S _ { \mathrm { I } } ^ { 2 1 }$ , and $\dot { S } _ { \mathrm { I } } ^ { 2 2 }$ ), and writes them in the Sentaurus Device AC data file.

The RF extraction library computes the spectral densities $S _ { \mathrm { V } } ^ { 1 2 }$ and $S _ { \mathrm { I } } ^ { 1 2 }$ , as well as

the spectral densities characterizing the external noise sources in the chain representation ( , , Svn Sin S $( S _ { \nu _ { n } } , S _ { i _ { n } } , S _ { \nu _ { n } { \overline { { i _ { n } } } } }$ , and $S _ { i _ { n } \nu _ { n } } ^ { \phantom { \dagger } } )$ (see rfx::GetNoiseFigure on page 540).

The RF extraction library converts the PSD data in the AC data file to PSD Tcl arrays using the rfx::Load procedure (see rfx::Load on page 547) and to Sentaurus Visual datasets using the rfx::CreateDataset procedure (see rfx::CreateDataset on page 526). Table 40 on page 529 gives examples of PSD matrix coefficients and the corresponding names of PSD variables in the AC data file, the PSD Tcl array name, and the dataset variable name.

The NISDs are computed for the current through the selected circuit nodes, assuming a fixed voltage at these nodes. The NVSDs are computed for the voltages at these nodes, assuming the net current to these nodes is fixed [4].

The NISD is saved as S_I and the NVSD is saved as S_V in the AC data file. In the case of the autocorrelation coefficient for node , the NISD is denoted by S_I(i). Thei cross-correlation coefficients have both real and imaginary parts. The real part of the NISD for nodes andi $j$ is denoted by ReS_IXI(i,j). The imaginary part is denoted by ImS_IXI(i,j). Similar conventions apply to the NVSD.

In addition to the previously mentioned NISD and NVSD, Sentaurus Device writes several partial noise spectral densities that describe the contribution of specific noise sources.

For example, S_V_ee is the NVSD due to electrons and S_V_eeDiff is the electron NVSD due to diffusion noise. For a list of all these spectral densities, see the Sentaurus™ Device User Guide [4].

# Power Spectral Density Tcl Arrays

For the impedance representation of a noisy two-port network (see Power Spectral Densities on page 508), the complex $\mathsf { S } _ { \mathsf { V } }$ -matrix (NVSD matrix) at a particular frequency $f$ and bias point v is represented by:

$$
S _ {\mathrm {V}} = \left[ \begin{array}{l l} S _ {\mathrm {V}} ^ {1 1} (f, \mathrm {v}) & S _ {\mathrm {V}} ^ {1 2} (f, \mathrm {v}) \\ S _ {\mathrm {V}} ^ {2 1} (f, \mathrm {v}) & S _ {\mathrm {V}} ^ {2 2} (f, \mathrm {v}) \end{array} \right] \tag {42}
$$

Similarly, the complex $\mathsf { S } _ { \mathsf { I } } .$ -matrix (NISD matrix) at a particular frequency $f$ and bias point v is represented by:

$$
S _ {\mathrm {I}} = \left[ \begin{array}{l l} S _ {\mathrm {I}} ^ {1 1} (f, \mathrm {v}) & S _ {\mathrm {I}} ^ {1 2} (f, \mathrm {v}) \\ S _ {\mathrm {I}} ^ {2 1} (f, \mathrm {v}) & S _ {\mathrm {I}} ^ {2 2} (f, \mathrm {v}) \end{array} \right] \tag {43}
$$

The coefficients $S _ { \mathrm { V } } ^ { i j } ( f , \mathrm { v } )$ and $S _ { \mathrm { I } } ^ { i j } ( f , { \mathrm { v } } )$ are defined in Power Spectral Densities on page 508.

When the Sentaurus Device AC data file is loaded in Sentaurus Visual using the rfx::Load procedure, the PSD Tcl arrays (see Table 38 on page 528) are also created if the file contains PSD data. A Tcl array is created for each PSD data stored in the AC data file. For example, the Tcl arrays rfx::SV and $\mathtt { r f x } \colon : \mathtt { S I }$ are created and contain the coefficients $S _ { \mathrm { V } } ^ { l j } ( f , \dot { \nu } )$ and $S _ { \mathrm { I } } ^ { l j } ( f , \nu ) ^ { \dagger }$ (see Table 40 on page 529).

The form of these PSD Tcl arrays is the same as the Tcl arrays rfx::AC and rfx::Y. For example, the arrays rfx::SV and rfx::SI have the form:

```txt
rfx::SV($ReIm,$P1,$P2,$if,$iv)  
rfx::SI($ReIm,$P1,$P2,$if,$iv)
```

where:

• For rfx::SV, 0 corresponds to $\Re ( S _ { \mathrm { V } } ^ { i j } ( f , \nu ) )$ and 1 corresponds to $\mathrm { I } ( { \cal S } _ { \mathrm { V } } ^ { i j } ( f , \nu ) )$ (Equation 42).   
• For rfx::SI, 0 corresponds to $\Re ( S _ { \mathrm { I } } ^ { i j } ( f , \nu ) )$ and 1 corresponds to $\mathrm { I } ( S _ { \mathrm { I } } ^ { i j } ( f , \nu ) )$ (Equation 43).

Each PSD array contains the autocorrelation coefficients (both ports are the same, $i = j$ ) as well as the cross-correlation coefficients (both ports are different, $i \neq j$ ). Since the autocorrelation values are real, the imaginary part is set to 0.

The PSD arrays for the local noise source (LNS) are created depending on the specific noise models activated in the Sentaurus Device command file. For example,

rfx::SVeeDiff is created only if the diffusion LNS is specified in the Sentaurus Device command file.

If there is a named noise specification in the Sentaurus Device command file, this name is prefixed to the name of the PSD Tcl array: <name>_rfx::SV. For example, if the name of the noise specification is diff, examples of array names are diff_rfx::SVeeDiff and diff_rfx::SV.

# Note:

Only one noise specification is supported per simulation. It can be either named or unnamed.

# Device Width Scaling for 2D Structures

A 3D device homogeneous in one of the directions (for example, the z-direction) can be analyzed by using a two-dimensional (2D) device structure. In this case, device simulation can be performed on the 2D device structure and the results for the 3D device can be obtained by multiplying the 2D simulation results (terminal currents, conductance, and capacitance) by the device width in the z-direction, , and in Equation 36, you replace:W

$$
A = W A ^ {2 D} \tag {44}
$$

$$
B = W B ^ {2 D} \tag {45}
$$

where A2D $A ^ { 2 \mathrm { D } }$ and B2D $B ^ { 2 \mathrm { D } }$ are the conductance matrix and the susceptance matrix of the 2D device, respectively.

can be set in one of the following ways:W

• In the Sentaurus Device input file using the keyword AreaFactor in the Physics section.   
During postprocessing using the rfx::Load procedure by specifying the -devicewidth keyword (see rfx::Load on page 547).

The default value of AreaFactor as well as the -devicewidth keyword is $1 \mu \mathrm { m }$

# Note:

Avoid applying the scaling twice by using only one of the scaling methods.

Some of the parameters such as $h _ { 2 1 }$ scale trivially with the device width. For other parameters such as S-parameters or the unilateral figure of merit, the device width is important.

# Note:

Not all RF quantities scale linearly with the device width. You must use the keyword AreaFactor in the Sentaurus Device command file to take into account the device width scaling for 2D structures.

# Matrix Conversions

As discussed in Overview of RF Extraction Library Procedures on page 503, the Y-matrix is converted to either an h-matrix, an S-matrix, or a Z-matrix using the matrix conversion formulas summarized here [5][6].

# Converting Y-Matrix to h-Matrix

The complex Y-matrix is converted to the complex h-matrix using the formulas:

$$
h _ {1 1} = \frac {1}{Y _ {1 1}}
$$

$$
h _ {1 2} = \frac {- Y _ {1 2}}{Y _ {1 1}} \tag {46}
$$

$$
h _ {2 1} = \frac {Y _ {2 1}}{Y _ {1 1}}
$$

$$
h _ {2 2} = \frac {D _ {y}}{Y _ {1 1}}
$$

with $D _ { y } = Y _ { 1 1 } Y _ { 2 2 } - Y _ { 1 2 } Y _ { 2 1 }$

# Converting Y-Matrix to S-Matrix

The complex Y-matrix is converted to the complex S-matrix using the formulas:

$$
S _ {1 1} = \frac {(1 - \bar {Y} _ {1 1}) (1 + \bar {Y} _ {2 2}) + \bar {Y} _ {1 2} \bar {Y} _ {2 1}}{N _ {y}}
$$

$$
S _ {1 2} = \frac {- 2 \bar {Y} _ {1 2}}{N _ {y}} \tag {47}
$$

$$
S _ {2 1} = \frac {- 2 \bar {Y} _ {2 1}}{N _ {y}}
$$

$$
S _ {2 2} = \frac {(1 - \bar {Y} _ {2 2}) (1 + \bar {Y} _ {1 1}) + \bar {Y} _ {1 2} \bar {Y} _ {2 1}}{N _ {y}}
$$

with:

$$
\bar {Y} _ {i j} = Z _ {o} Y _ {i j} \tag {48}
$$

where $Z _ { o }$ is the characteristic impedance and $N _ { y } = ( 1 + \bar { Y } _ { 1 1 } ) ( 1 + \bar { Y } _ { 2 2 } ) - \bar { Y } _ { 1 2 } \bar { Y } _ { 2 1 }$ .

# Converting Y-Matrix to Z-Matrix

The complex Y-matrix is converted to the complex Z-matrix using the formulas:

$$
Z _ {1 1} = \frac {Y _ {2 2}}{D _ {y}}
$$

$$
Z _ {1 2} = \frac {- Y _ {1 2}}{D _ {y}} \tag {49}
$$

$$
Z _ {2 1} = \frac {- Y _ {2 1}}{D _ {y}}
$$

$$
Z _ {2 2} = \frac {Y _ {1 1}}{D _ {y}}
$$

with $D _ { y } = Y _ { 1 1 } Y _ { 2 2 } - Y _ { 1 2 } Y _ { 2 1 }$

# Gains, Amplifier Stability, and Unilateralization

This section discusses gains, amplifier stability, and unilateralization.

# Small-Signal Current Gain

The short-circuit small-signal current gain $h _ { 2 1 }$ of a transistor is given by:

$$
h _ {2 1} = \left| \frac {Y _ {2 1}}{Y _ {1 1}} \right| \tag {50}
$$

# Amplifier Stability

The Rollett stability factor $K$ is computed from the S-parameters using the formula [6][7]:

$$
K = \frac {1 - \left| S _ {1 1} \right| ^ {2} - \left| S _ {2 2} \right| ^ {2} + \left| \Delta \right| ^ {2}}{2 \left| S _ {1 2} \cdot S _ {2 1} \right|} \tag {51}
$$

where:

$$
\left| \Delta \right| = \left| S _ {1 1} \cdot S _ {2 2} - S _ {1 2} \cdot S _ {2 1} \right| \tag {52}
$$

The necessary and sufficient conditions for unconditional stability for an amplifier are [6]:

$$
K > 1 \tag {53}
$$

$$
\left| \Delta \right| <   1
$$

Unconditional stability indicates conjugate matching between output and input loads. For $K < 1$ , an amplifier is conditionally stable or potentially unstable and must be stabilized.

# Maximum Stable Gain and Maximum Available Gain

The maximum stable gain (MSG) $G _ { \mathrm { m s } }$ of a two-port network is given by [7][8]:

$$
G _ {\mathrm {m s}} = \left| \frac {S _ {2 1}}{S _ {1 2}} \right| \tag {54}
$$

The maximum available gain (MAG) $G _ { \mathrm { m a } }$ depends on the stability of the two-port network. For an unconditionally stable two-port network, that is, if both $K > 1$

and $| \Delta | < 1$ :

$$
G _ {\mathrm {m a}} (K > 1, | \Delta | <   1) = G _ {\mathrm {m s}} \cdot \left(\mathrm {K} - \sqrt {\mathrm {K} ^ {2} - 1}\right) \tag {55}
$$

For $K \leq 1$ or $| \Delta | > 1$ , MAG is set to MSG [9]:

$$
G _ {\mathrm {m a}} (K \leq 1, | \Delta | > 1) = G _ {\mathrm {m s}} \tag {56}
$$

# Unilateral Amplifier Design

Mason’s unilateral gain (MUG) $U$ is computed from the S-parameters using the formula [8]:

$$
U = \frac {\left| \frac {S _ {2 1}}{S _ {1 2}} - 1 \right| ^ {2}}{2 K \left| \frac {S _ {2 1}}{S _ {1 2}} \right| - 2 \cdot \Re \left(\frac {S _ {2 1}}{S _ {1 2}}\right)} \tag {57}
$$

where $\Re ( z )$ denotes the real part of the complex number .z

The unilateral figure of merit $U _ { \mathrm { f } }$ is given by [6]:

$$
U _ {\mathrm {f}} = \frac {\left| S _ {1 2} \right| \left| S _ {2 1} \right| \left| S _ {2 2} \right| \left| S _ {1 1} \right|}{\left(1 - \left| S _ {1 1} \right| ^ {2}\right) \left(1 - \left| S _ {2 2} \right| ^ {2}\right)} \tag {58}
$$

For a unilateral amplifier design approach, $U _ { \mathrm { f } }$ must be as small as possible.

# Converting Gain Units to Decibels

The short-circuit current gain, $\left| h _ { 2 1 } \right|$ , can be expressed in units of decibel (dB) using:

$$
\left| h _ {2 1} \right| [ \mathrm {d B} ] = 2 0 \log \left| h _ {2 1} \right| \tag {59}
$$

The power gain, $P$ , is expressed in units of dB using:

$$
P [ \mathrm {d B} ] = 1 0 \log | P | \tag {60}
$$

# Transistor Figures of Merit

This section discusses transistor figures of merit.

# ft and fmax

The frequency dependency of the magnitude of the current gain $\left| h _ { 2 1 } \right|$ is given by [2]:

$$
\left| h _ {2 1} \right| \approx \frac {\beta}{\sqrt {1 + \left(\frac {f}{f _ {\beta}}\right) ^ {2}}} \tag {61}
$$

where $\beta$ is the current gain at low frequency, and $f _ { \beta }$ is the $\beta$ cutoff frequency or the 3 dB frequency.

The short-circuit current gain cutoff frequency or the cutoff frequency $f _ { \mathrm { t } }$ is defined as the frequency at which $\left| h _ { 2 1 } \right| = 1$ (unit gain point):

$$
f _ {\mathrm {t}} \equiv f \left(\left| h _ {2 1} \right| = 1 = 0 [ \mathrm {d B} ]\right) \tag {62}
$$

$f _ { \mathrm { t } }$ is related to $f _ { \beta }$ :

$$
f _ {\mathrm {t}} = \beta f _ {\beta} \tag {63}
$$

Equation 61 shows that for $f \ll f _ { \beta }$ (low frequencies):

$$
\left| h _ {2 1} \right| \approx \beta \tag {64}
$$

and for $f \gg f _ { \beta }$ (high frequencies):

$$
\left| h _ {2 1} \right| \approx \frac {f _ {\mathrm {t}}}{f} \tag {65}
$$

Converting the unit of $\left| h _ { 2 1 } \right|$ to dB (using Equation 59), Equation 65 can be written as:

$$
\left| h _ {2 1} \right| [ \mathrm {d B} ] = 2 0 \log f _ {\mathrm {t}} - 2 0 \log f \tag {66}
$$

Therefore, the $\left| h _ { 2 1 } \right|$ (in units of dB) versus $\log f$ curve (current gain curve) is flat at low frequencies, reduces by 3 dB at $f _ { \beta }$ , and falls off linearly with a slope of –20 dB/decade with increasing frequencies.

Let $( \log f _ { 0 } , \big | h _ { \underline { { 2 1 } } , 0 } \big | [ \underline { { \mathrm { d B } } } ] )$ be a high frequency point at which the –20 dB/decade slope is fully established. From Equation 66:

$$
2 0 \log \frac {f _ {\mathrm {t}}}{f _ {0}} = \left| h _ {2 1, 0} \right| [ \mathrm {d B} ] \tag {67}
$$

or:

$$
f _ {\mathrm {t}} = f _ {0} \cdot 1 0 ^ {\left| h _ {2 1, 0} \right| [ \mathrm {d B} ] / 2 0} \tag {68}
$$

Therefore, Equation 66 implies that $f _ { \mathrm { t } }$ can also be determined by linear extrapolation from a high frequency point $( \log f _ { 0 } , | h _ { 2 1 , 0 } | [ \dot { \bf d B } ] )$ on the current gain curve, using Equation 68 [9].

The frequency dependency of MUG or MAG at high frequencies is given by [9]:

$$
G \approx \frac {f _ {\max} ^ {2}}{f ^ {2}} \tag {69}
$$

where $G$ is either MUG or MAG, and $f _ { \mathrm { m a x } }$ is the maximum frequency of oscillation. $f _ { \mathrm { m a x } }$ can be extracted using either MUG or MAG [9].

$f _ { \mathrm { m a x } }$ is defined as the frequency at which $U = 1$ (unit gain point):

$$
f _ {\max } \equiv f (U = 1 = 0 [ \mathrm {d B} ]) \tag {70}
$$

or the frequency at which $G _ { \mathrm { m a } } = 1$

$$
f _ {\max } \equiv f \left(G _ {\mathrm {m a}} = 1 = 0 [ \mathrm {d B} ]\right) \tag {71}
$$

is the maximum frequency at which power gain can be extracted from an amplifier. It is fmax $f _ { \mathrm { m a x } }$ also the maximum frequency of oscillation of an oscillator made from an amplifier with power gain. If $U > 1$ , the transistor is active and $f _ { \mathrm { m a x } }$ is extracted. If $U \leq 1$ , the transistor is passive and $f _ { \mathrm { m a x } }$ is not extracted [10].

Similar to ,ft $f _ { \mathrm { m a x } }$ also can be determined by linear extrapolation from a point $( \log f _ { 0 }$ on the power gain curve (U0 ) , [ ] dB $U$ in units of dB versus $\log f$ ) with a slope of – 20 dB/decade, using [2]:

$$
f _ {\max } = f _ {0} \cdot 1 0 ^ {(U _ {0} [ \mathrm {d B} ]) / 2 0} \tag {72}
$$

A similar equation is used to extract $f _ { \mathrm { m a x } }$ from a $G _ { \mathrm { m a } }$ versus $f$ curve:

$$
f _ {\max } = f _ {0} \cdot 1 0 ^ {(G _ {\mathrm {m a}, 0} [ \mathrm {d B} ]) / 2 0} \tag {73}
$$

# Extraction Methods for ft and fmax

$f _ { \mathrm { t } }$ and $f _ { \mathrm { m a x } }$ are extracted from the corresponding gain curves by the following RF extraction library procedures:

• rfx::GetFt extracts $f _ { \mathrm { t } }$ from the $\left| h _ { 2 1 } \right|$ versus frequency curve.   
rfx::GetFmax extracts $f _ { \mathrm { m a x } }$ from the $U$ versus frequency curve, or the $G _ { \mathrm { m a } }$ versus frequency curve. For brevity, either of these power gains is denoted by $G$ .

Both procedures use three different methods of extraction: unit-gain-point, extract-at-dBPoint, and extract-at-frequency. The last two methods are extrapolation methods and assume the ideal frequency dependency of gain (flat at low frequencies, and falling off linearly at higher frequencies with a slope of –20 dB/decade). None of these methods checks the validity of these assumptions.

The extraction methods are (see Figure 143):

(a) The unit gain point method uses the definition of $f _ { \mathrm { t } }$ (Equation 62) and $f _ { \mathrm { m a x } }$ (Equation 70 or Equation 71). It searches directly for the unit gain point but might give inappropriate results if the gain curves deviate from the –20 dB/decade slope near the unit gain point.   
(b) The extract at dB point method looks for the gain point $\mathbf { \chi } ^ { \prime } ( \log f _ { 0 } , \left| h _ { 2 1 , 0 } \right| [ \mathbf { d B } ] )$ or $( \log f _ { 0 }$ , $G _ { 0 } [ \mathrm { d B } ] )$ ) where the gain ) $( \left| h _ { 2 1 } \right|$ or $G$ ) has fallen by a certain number of decibels from its value at the start of the gain curve. This difference in decibels is called the dB point and is specified using the keyword -parameter in units of dB. Assuming a –20 dB/decade slope, the gain point $( ( \log f _ { \underline { { 0 } } } , \left| h _ { 2 \underline { { 1 } } , 0 } \right| [ \underline { { \mathrm { d B } } } ] )$ or $( \log f _ { 0 } , G _ { 0 } [ \mathrm { d B } ] )$ ) is used to compute $f _ { \mathrm { t } }$ using Equation 68 or $f _ { \mathrm { m a x } }$ using Equation 72 or Equation 73. This method might give inappropriate results if the –20 dB/decade slope is not fully established at the gain point. Often, the results can be improved by adjusting the dB point.   
(c) The extract at frequency method is the same as method (b), but the frequency corresponding to the unit gain point is extrapolated from a specified frequency $f _ { 0 }$ . The frequency $f _ { 0 }$ is specified using the keyword -parameter. The corresponding gain $\| h _ { 2 1 , 0 } \vert \mathrm { [ d B ] }$ or $G _ { 0 } [ \mathrm { d B } ]$ ) is computed, and $f _ { \mathrm { t } }$ or $f _ { \mathrm { m a x } }$ is computed using Equation 68 or Equation 72 and Equation 73. This method might give inappropriate results if the –20 dB/ decade slope is not fully established at this gain point. The optimal frequency for this method can depend on the control bias or current, and might be different for $G$ and $\left| h _ { 2 1 } \right|$ .

![](images/a43b506e93b37ada8a100621bef158d27d8646fc83ae92cdaca545b7a105db1e.jpg)  
Figure 143 Different extraction methods and the circumstances under which they might return inappropriate results

![](images/9c2bdfb3a75334c8431b75e12ff034fdd216dec53ca1b37f146580fc8d6d9951.jpg)

Unfortunately, no single extraction method of $f _ { \mathrm { t } }$ and $f _ { \mathrm { m a x } }$ is appropriate under all circumstances. Technically, method (a), the direct search for the unit gain point, should be the most appropriate method. However, at high frequencies, additional parasitic elements might become dominant and alter the –20 dB/decade slope near the unit gain point. Furthermore, in experiments, it is sometimes difficult to trace the gain curve to high-enough frequencies to see the unit gain point directly. Therefore, extrapolation of experimental data

to the unit gain point is common. In this case, the experiment might not ‘see’ the altered slope due to the parasitics (also some parasitics might not be included in the simulation). For a comparison with experimental results, therefore, method (b) or method (c) might be better.

The extraction methods assume that, for each value of the control bias or current, a full frequency sweep is performed. Ideally, this sweep should start at a frequency where the gain is flat (low-frequency regime) and should end beyond the unit gain point. If the frequency sweep does not go beyond the unit gain point, method (a) sets the value of $f _ { \mathrm { t } }$ to zero. If the frequency sweep does not start in the flat region, methods (b) and (c) still return a (nonzero) value. However, you must ensure that, at the selected dB point (for method (b)) or the frequency point (for method (c)), the –20 dB/decade slope is established.

The transition between the flat low-frequency region of the gain curves to the –20 dB/ decade slope at higher frequencies can be wide. Sometimes, a clear –20 dB/decade slope is never reached. In this case, methods (b) and (c) might give incorrect results (often, the results can be improved by adjusting the dB point used for the extrapolation).

The simulation of a full frequency sweep in Sentaurus Device can be time consuming, especially for large structures and if many equations are solved. If it is known beforehand that, at a given frequency, the slope of the gain curves is –20 dB/decade, it is sufficient to simulate the small-signal response at this single frequency only and to apply method (c). However, the band of frequencies for which the –20 dB/decade slope assumption holds true can be very narrow and can depend on the bias conditions.

This discussion shows that using solely one method might give inappropriate results. Therefore, it is recommended to always use all three methods concurrently. If the or ft fmax $f _ { \mathrm { t } }$ $f _ { \mathrm { m a x } }$ curves for all three methods agree well, the results can be trusted with a high level of confidence. If the results are very different, most likely, the form of the gain curve prevents a meaningful automatic extraction of $f _ { \mathrm { t } }$ and $f _ { \mathrm { m a x } }$ . In this case, it is suggested to examine the underlying gain curves and the slope of the gain curves. In most such cases, it is clear that the assumptions on which the extractions are based are not fulfilled. That is, the gain curve does not fall off with a clean –20 dB/decade slope at high frequencies.

# Cutoff Frequency for Stability

The cutoff frequency for stability $f _ { K 1 }$ is defined as the frequency point at which $K = 1$ (the boundary between the unconditionally stable and conditionally stable region):

$$
f _ {K 1} \equiv f (K = 1) \tag {74}
$$

# Noise Figure of a Linear Two-Port Network

The noise factor $F$ of a linear two-port network is defined as the signal-to-noise ratio at the input port divided by the signal-to-noise ratio at the output port.

In the RF extraction library, the y-parameters of the noisy two-port network and the PSDs of the admittance representation are used to compute the PSDs of the chain representation,

which are then used to compute the noise figure and the noise parameters of the two-port network.

As discussed in Power Spectral Densities on page 508, in the chain representation, the noisy two-port network consists of two noise sources, ${ \mathsf { v } } _ { \mathsf { n } }$ and $\mathsf { i } _ { \mathsf { n } }$ , placed at the input port. The two-port is driven by a sinusoidal source of either internal admittance $Y _ { \mathrm { s } }$ (source admittance) or internal impedance $Z _ { \mathrm { s } }$ (source impedance). The noise figure  NF (Equation 94) of the noisy two-port network is the noise factor $F$ expressed in units of dB (Equation 92). It is determined by the source admittance and the noise parameters of the two-port <Hotlink>[9]. The noise parameters are:

Minimum noise figure, $N F _ { \mathrm { m i n } }$ (Equation 93)   
• Equivalent noise resistance $R _ { n }$ of the noise voltage source (Equation 76)   
• Optimum source admittance $Y _ { \mathrm { o p t } }$ (Equation 87 and Equation 88)

The optimum source admittance is the value of the source admittance at which the noise figure has its minimum value $N F _ { \operatorname* { m i n } } . R _ { n }$ . dFmin Rn etermines the sensitivity of the noise figure to deviations from .Yopt $Y _ { \mathrm { o p t } }$

An alternative set of noise parameters is [11]:

Minimum noise figure, $N F _ { \mathrm { m i n } }$ min (Equation 93)   
• Equivalent noise conductance $G _ { n }$ of the noise voltage source (Equation 82)   
Optimum source impedance $Z _ { \mathrm { o p t } }$ (Equation 90)

The above admittances and impedances can be normalized by dividing by the characteristic impedance $Z _ { o }$ , and these values are called normalized admittances and impedances $( r _ { n }$ , $y _ { \mathrm { o p t } } , g _ { n }$ , and $z _ { \mathrm { o p t } }$ ).

The equations used to compute the noise figure, the noise parameters, and various other quantities using the rfx::NoiseFigure procedure (see rfx::NoiseFigure on page 549) are discussed here [2][11][12][13][14].

The spectral density of the equivalent input noise voltage source $S _ { \nu _ { n } }$ is computed using:

$$
S _ {v _ {n}} = \frac {S _ {\mathrm {I}} ^ {2 2}}{\left| Y _ {2 1} \right|} \tag {75}
$$

The equivalent noise resistance $R _ { n }$ of the noise voltage source is computed using:

$$
R _ {n} = \frac {S _ {v _ {n}}}{4 k _ {\mathrm {B}} T _ {o}} \tag {76}
$$

where:

• $k _ { \mathrm { B } }$ is the Boltzmann constant.

• $T _ { o } = 2 9 0 \mathrm { K }$ is the standard noise temperature.

The normalized equivalent noise resistance $r _ { n }$ is computed using:

$$
r _ {n} = \frac {R _ {n}}{Z _ {o}} \tag {77}
$$

The equivalent noise conductance $G _ { u }$ and the normalized equivalent noise conductance $g _ { u }$ of the uncorrelated noise current component are given by:

$$
G _ {u} = \frac {1}{4 k _ {\mathrm {B}} T _ {o}} \left(S _ {\mathrm {I}} ^ {1 1} - \frac {\left| S _ {\mathrm {I}} ^ {1 2} \right| ^ {2}}{S _ {\mathrm {I}} ^ {2 2}}\right) \tag {78}
$$

$$
g _ {u} = \frac {G _ {u}}{Z _ {o}} \tag {79}
$$

The correlation admittance $Y _ { \mathrm { c o r } }$ is given by:

$$
Y _ {\text {c o r}} = G _ {\text {c o r}} + j B _ {\text {c o r}} = Y _ {1 1} - Y _ {2 1} \frac {S _ {\mathrm {I}} ^ {1 2}}{S _ {\mathrm {I}} ^ {2 2}} \tag {80}
$$

where:

$G _ { \mathrm { c o r } }$ is the correlation conductance.   
• $B _ { \mathrm { c o r } }$ is the correlation susceptance.

The spectral density of the equivalent input noise current source $S _ { i _ { n } }$ is given by:

$$
S _ {i _ {n}} = 4 k _ {\mathrm {B}} T _ {o} \left(\left| Y _ {\mathrm {c o r}} \right| ^ {2} R _ {n} + G _ {u}\right) \tag {81}
$$

The equivalent noise conductance $G _ { n }$ and the normalized equivalent noise conductance $g _ { n }$ of the input noise current source are computed using:

$$
\begin{array}{l} G _ {n} = \frac {S _ {i _ {n}}}{4 k _ {\mathrm {B}} T _ {o}} \tag {82} \\ g _ {n} = \frac {G _ {n}}{Z _ {o}} \\ \end{array}
$$

The cross-correlation spectral densities $S _ { \nu _ { n } \overline { { i } } _ { n } }$ and $S _ { i _ { n } \nu _ { n } }$ of the equivalent input noise voltage and noise current sources are given by:

$$
\begin{array}{l} S _ {v _ {n} \bar {i} _ {n}} = \overline {{Y _ {\mathrm {c o r}}}} S _ {v _ {n}} \tag {83} \\ S _ {i _ {n} \overline {{v}} _ {n}} = \overline {{S _ {v _ {n} \overline {{i}} _ {n}}}} \\ \end{array}
$$

The noise correlation coefficient between the equivalent input noise voltage and noise current source is computed using:

$$
C _ {i _ {n} v _ {n}} = \frac {S _ {i _ {n} \bar {v} _ {n}}}{\sqrt {S _ {i _ {n}} S _ {v _ {n}}}} \tag {84}
$$

The source admittance and the source impedance are defined as:

$$
Y _ {\mathrm {s}} = G _ {\mathrm {s}} + j B _ {\mathrm {s}}
$$

$$
Z _ {\mathrm {s}} = R _ {\mathrm {s}} + j X _ {\mathrm {s}} = \frac {1}{Y _ {\mathrm {s}}} \tag {85}
$$

where:

$G _ { \mathrm { s } }$ is the source conductance.   
$B _ { \mathrm { s } }$ is the source susceptance.   
$R _ { \mathrm { s } }$ is the source resistance.   
• $X _ { \mathrm { s } }$ is the source reactance.

The optimum source admittance $Y _ { \mathrm { o p t } }$ is defined as:

$$
Y _ {\text {o p t}} = G _ {\text {o p t}} + j B _ {\text {o p t}} \tag {86}
$$

The optimum source conductance $G _ { \mathrm { o p t } }$ is computed using:

$$
G _ {\text {o p t}} = \sqrt {\frac {G _ {u} + R _ {n} G _ {\text {c o r}} ^ {2}}{R _ {n}}} \tag {87}
$$

The optimum source susceptance $B _ { \mathrm { o p t } }$ is computed using:

$$
B _ {\text {o p t}} = - B _ {\text {c o r}} \tag {88}
$$

The normalized optimum source admittance $y _ { \mathrm { o p t } }$ is computed using:

$$
y _ {\text {o p t}} = \frac {Y _ {\text {o p t}}}{Z _ {o}} \tag {89}
$$

The optimum source impedance $Z _ { \mathrm { o p t } }$ and the normalized optimum source impedance  zopt are defined as:

$$
Z _ {\text {o p t}} = R _ {\text {o p t}} + j X _ {\text {o p t}} = \frac {1}{Y _ {\text {o p t}}} \tag {90}
$$

$$
z _ {\mathrm {o p t}} = \frac {Z _ {\mathrm {o p t}}}{Z _ {o}}
$$

The minimum noise factor $F _ { \mathrm { m i n } }$ is given by:

$$
F _ {\min } = 1 + 2 R _ {n} \left(G _ {\mathrm {c o r}} + G _ {\mathrm {o p t}}\right) \tag {91}
$$

and the noise factor $F$ is computed using:

$$
F = F _ {\min } + \frac {R _ {n}}{G _ {\mathrm {s}}} \left[ \left(G _ {\mathrm {s}} - G _ {\mathrm {o p t}}\right) ^ {2} + \left(B _ {\mathrm {s}} - B _ {\mathrm {o p t}}\right) ^ {2} \right] \tag {92}
$$

The minimum noise figure $N F _ { \mathrm { m i n } }$ [dB] is computed using:

$$
N F _ {\min } = 1 0 \log_ {1 0} F _ {\min } \tag {93}
$$

The noise figure [dB] is computed using:NF

$$
N F = 1 0 \log_ {1 0} F \tag {94}
$$

# rfx Namespace Variables

Many RF extraction library procedures use the variables summarized in Table 37. These variables are created by the rfx::Load procedure.

# Note:

If there is a named noise specification in the Sentaurus Device command file, this name is prefixed to the name of the PSD Tcl array, for example, <name>_rfx::SV.

Table 37 rfx namespace variables   

<table><tr><td>Variable name</td><td>Description</td></tr><tr><td>rfx::AC</td><td>AC array (see A-Matrix, C-Matrix, and Y-Matrix on page 506).</td></tr><tr><td>rfx::Y</td><td>Y-matrix (see A-Matrix, C-Matrix, and Y-Matrix on page 506).</td></tr><tr><td>rfx::nfreq</td><td>Number of frequencies.</td></tr><tr><td>rfx::freq</td><td>List of frequencies.</td></tr><tr><td>rfx::i_freqstart</td><td>Index of the first element in the list of frequencies, rfx::freq.</td></tr><tr><td>rfx::i_freqend</td><td>Index of the last element in the list of frequencies, rfx::freq.</td></tr><tr><td>rfx::nbias</td><td>Number of bias points.</td></tr><tr><td>rfx::bias</td><td>List of bias points.</td></tr><tr><td>rfx::i_biasstart</td><td>Index of the first element in the list of bias points, rfx::bias.</td></tr><tr><td>rfx::i_biasend</td><td>Index of the last element in the list of bias points, rfx::bias.</td></tr><tr><td>rfx::z0</td><td>Characteristic impedance in units of Ω. Default: 50 Ω.</td></tr><tr><td>rfx::Zs</td><td>Source impedance [Ω] seen by the two-port network. Default: [$rfx::z0 0]</td></tr><tr><td>rfx::T0</td><td>Standard noise temperature.</td></tr><tr><td colspan="2">Noise or power spectral density arrays</td></tr><tr><td>rfx::SV</td><td>NVSD matrix (\(S_{\text{V}}^{11}\), \)S\(^12_{\text{V}}\), \)S\(^21_{\text{V}}\), and \)S\(^22_{\text{V}}$).</td></tr><tr><td>rfx::SI</td><td>NISD matrix (\(S_{\text{I}}^{11}\), \)S\(^12_{\text{I}}\), \)S\(^21_{\text{I}}\), and \)S\(^22_{\text{I}}$).</td></tr><tr><td colspan="2">Partial noise spectral density arrays</td></tr><tr><td>rfx::SVee</td><td>Electron NVSD matrix.</td></tr><tr><td>rfx::SVhh</td><td>Hole NVSD matrix.</td></tr><tr><td>rfx::SIee</td><td>Electron NISD matrix.</td></tr><tr><td>rfx::SIhh</td><td>Hole NISD matrix.</td></tr><tr><td>rfx::SVeeDiff</td><td>Electron NVSD matrix due to diffusion LNS.</td></tr><tr><td>rfx::SVhhDiff</td><td>Hole NVSD matrix due to diffusion LNS.</td></tr><tr><td>rfx::SVeeMonoGR</td><td>Electron NVSD matrix due to monopolar generation–recombination (GR) LNS.</td></tr><tr><td>rfx::SVhhMonoGR</td><td>Hole NVSD matrix due to monopolar GR LNS.</td></tr><tr><td>rfx::SVeeFlickerGR</td><td>Electron NVSD matrix due to flicker GR LNS.</td></tr><tr><td>rfx::SVhhFlickerGR</td><td>Hole NVSD matrix due to flicker GR LNS.</td></tr></table>

# Characteristic Impedance and Source Impedance

The RF extraction library uses the characteristic impedance $Z _ { o }$ to:

Convert Y-parameters to S-parameters (see Equation 47 on page 513 and rfx::Y2S on page 557).   
Compute the normalized values of various noise parameter–related admittances and impedances (see Noise Figure of a Linear Two-Port Network on page 519).

The RF extraction library also uses the source impedance $Z _ { \mathrm { s } }$ to compute the noise figure (see Equation 94 on page 523 and rfx::NoiseFigure on page 549).

In the RF extraction library, $Z _ { o }$ and $Z _ { \mathrm { s } }$ are represented by the $\mathtt { r f x } \colon : \mathtt { z } 0$ and rfx::Zs variables, respectively (see Table 37 on page 523).

$Z _ { o }$ defaults to $5 0 ~ \Omega$ . To change the characteristic impedance to $1 0 0 ~ \Omega$ , for example, use the following command after loading the RF extraction library:

set rfx::z0 100.0

$Z _ { \mathrm { s } }$ defaults to $5 0 + j 0 \Omega$ . To change the source impedance to $1 0 0 + j 0 \Omega$ , for example, use the following command after loading the RF extraction library:

set rfx::Zs [list 100.0 0.0]

# rfx::CreateDataset

Creates a Sentaurus Visual dataset corresponding to an RF matrix or a PSD matrix as a function of frequency or bias.

# Syntax

```snap
rfx::CreateDataset -dataset <dataName>  
[-rfmatrix "AC" | "Y" | "H" | "Z" | "S" | "SV" | "SI"]  
[-dB 0 | 10 | 20]  
[-noisename <string>] [-axis "frequency" | "bias"]  
[-info 0 | 1 | 2 | 3] [-help 0 | 1] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-dataset &lt;dataName&gt;</td><td>Name of a Sentaurus Visual dataset. The dataset contains variables for all the RF parameters in the RF matrix specified using the keyword -rfmatrix, as a function of frequency for each bias point (-xaxis "frequency") or bias for each frequency (-xaxis "bias"). For -xaxis "frequency", the variables are created for all the bias point indices (0 to rfx::i.biasend). For -xaxis "bias", the variables are created for all the frequency point indices (0 to rfx::i_freqend). For example, for -rfmatrix "Y" and -xaxis "frequency", the dataset contains the Y-parameters as a function of frequency for each bias point. Therefore, the variables "bias_&lt;i&gt; y&lt;ij&gt;_Re" and "bias_&lt;i&gt; frequency" are created. Here, i is the bias point index and ij refers to the port numbers (11, 12, 21, 22). If -dB 10 (or 20) is specified, 10dB (or 20dB) is appended to the name of the variable corresponding to the absolute value of the RF parameter. The variables are summarized in Table 38 on page 528. Similar variables are created for other RF parameters. For -rfmatrix "SV" or -rfmatrix "SI", variables for all the power spectral densities are created. These are summarized in Table 39 on page 528. In addition, the variables for all of the Y-parameters are created. (String, no default)</td></tr><tr><td>-rfmatrix "AC" | "Y" | "H" | "Z" | "S" | "SV" | "SI"</td><td>Name of the RF or PSD matrix. (String, default: "AC")</td></tr><tr><td>-dB 0 | 10 | 20</td><td>Decibel level for computing the absolute value of an RF parameter. For -dB 0, the absolute value is computed on linear scale. Default: 0</td></tr><tr><td>-noisename &lt;string&gt;</td><td>Name of the noise specification. 
Required only for -rfmatrix "SV" or -rfmatrix "SI", and in the case when a named noise specification was used to perform noise analysis. (String, default: ")</td></tr><tr><td>-xaxis "frequency" | "bias"</td><td>Selects the x-axis as either frequency or bias. Selects the sorting order. For example, for -xaxis "frequency", the data is created using a loop with frequency as the inner variable and bias as the outer variable. 
(String, default: "frequency")</td></tr><tr><td>-info 0 | 1 | 2 | 3</td><td>Sets local information level. Default: 0</td></tr><tr><td>-help 0 | 1</td><td>Prints a help screen if set to 1. Default: 0</td></tr></table>

# Returns

None.

# Example

```txt
# Ex 1: Create AC matrix and Y-matrix  
rfx::Load -dataset "ACPLT_nMOS" -file "DATA/nMOS_ac_des.plt" \ -port1 1 -port2 2 -biasport "v(1)" -devicewidth 0.9  
# Create Y-parameter dataset as a function of bias  
rfx::CreateDataset -dataset "Y.bias" -axis "bias" -rfmatrix "Y"  
# Create AC parameter dataset as a function of frequency  
rfx::CreateDataset -dataset "AC_freq" -axis "frequency" -rfmatrix "AC"  
# Ex 2: Create AC, Y-matrix, and PSD matrices  
rfx::Load -dataset "ACPLT_noise_nMOS" \ -file "DATA/nMOS-noise_ac_des.plt" \ -port1 1 -port2 2 -biasport "v(1)"  
# Create NVSD dataset as a function of frequency  
rfx::CreateDataset -dataset "2port_PSD_freq" -axis "frequency" \ -rfmatrix "SV" 
```

Table 38 Dataset variable names for -xaxis "frequency" and -rfmatrix "Y"   

<table><tr><td>Dataset variable name</td><td>Description</td></tr><tr><td>bias_&lt;i&gt; frequency</td><td>List of frequencies.</td></tr><tr><td>bias_&lt;i&gt; y&lt;ij&gt;_Re</td><td>List of the real parts of the Y-parameter, Yij.</td></tr><tr><td>bias_&lt;i&gt; y&lt;ij&gt;_Im</td><td>List of the imaginary parts of the Y-parameter, Yij.</td></tr><tr><td>bias_&lt;i&gt; y&lt;ij&gt;_Abs</td><td>List of the absolute values of the Y-parameter, Yij. This variable is created if the keyword -dB is not specified or -dB 0 is specified.</td></tr><tr><td>bias_&lt;i&gt; y&lt;ij&gt;_Abs_10dB</td><td>List of the absolute values of the Y-parameter, Yij, on a 10 dB scale. This variable is created only if -dB 10 is specified.</td></tr><tr><td>bias_&lt;i&gt; y&lt;ij&gt;_Abs_20dB</td><td>List of the absolute values of the Y-parameter, Yij, on a 20 dB scale. This variable is created only if -dB 20 is specified.</td></tr><tr><td>bias_&lt;i&gt; y&lt;ij&gt;_Phase</td><td>List of the phases of the Y-parameter, Yij.</td></tr><tr><td colspan="2">Here, ij refers to the port numbers (11, 12, 21, 22); i is the bias point index; iv varies from rfx::i_biasstart to rfx::i_biasend. These variables are created for all the Y-parameters: Y11, Y12, Y21, and Y22.</td></tr></table>

Table 39 Dataset variable names for -xaxis "frequency" and -rfmatrix "SV"   

<table><tr><td>Dataset variable name</td><td>Description</td></tr><tr><td>bias_&lt;i&gt; frequency</td><td>List of frequencies.</td></tr><tr><td>bias_&lt;i&gt; sv&lt;ij&gt;</td><td>List of NVSD autocorrelation coefficients (SijV, i = j).</td></tr><tr><td>bias_&lt;i&gt; sv&lt;ij&gt;_Re</td><td>List of the real parts of the NVSD cross-correlation coefficients (SijV, i≠j).</td></tr><tr><td>bias_&lt;i&gt; sv&lt;ij&gt;_Im</td><td>List of the imaginary parts of the NVSD cross-correlation coefficients (SijV, i≠j).</td></tr><tr><td>bias_&lt;i&gt; sv&lt;i&gt; _Abs</td><td>List of the absolute values of the NVSD cross-correlation coefficients, (Svij, i≠j). This variable is created if the keyword -dB is not specified or -dB 0 is specified.</td></tr><tr><td>bias_&lt;i&gt; sv&lt;i&gt;_Phase</td><td>List of the phases of the cross-correlation coefficients, (Sij, i≠j).</td></tr><tr><td colspan="2">Here, ij refers to the port numbers (11, 12, 21, 22); i is the bias point index; iv varies from rfx::i_biasstart to rfx::i_biasend. These variables are created for all of the coefficients of the SV-matrix: S11, S12, S21, and S22.</td></tr></table>

# Note:

Table 39 lists the variables corresponding to $S _ { \mathrm { V } } ^ { i j }$ . Similar variables are created for $S _ { \mathrm { I } } ^ { i j }$ . For the partial noise spectral densities that describe the contribution of specific noise sources, the name of the specific noise source is included in parentheses, for example, svij(ee), svij(eeMonoGR), and svij_Re(eeMonoGR). If there is a named noise specification, this name is prefixed to the name of the variable. For example, if the name of the noise specification is diff, examples of variable names are diff_svij(ee), diff_svij(eeDiff), and diff_svij_Re(eeDiff).

Table 40 on page 529 lists examples of PSD matrix coefficients and the corresponding names of PSD variables in the AC data file, the PSD Tcl array name and element, and the name of the corresponding dataset variables.

Table 40   
PSD data in AC data file, PSD Tcl array element, and dataset variables   

<table><tr><td>Coefficient of PSD matrix</td><td>PSD variable in AC data file</td><td>PSD Tcl array element</td><td>Dataset variables</td></tr><tr><td colspan="4">NVSD matrix SV</td></tr><tr><td>SV11(f,v)</td><td>S_V(1)</td><td>rfx::SV(0,1,1,$if, $iv)</td><td>sv11</td></tr><tr><td rowspan="4">SV12(f,v)</td><td rowspan="4">-</td><td>rfx::SV(0,1,2,$if, $iv)</td><td>sv12_Re</td></tr><tr><td>rfx::SV(1,1,2,$if, $iv)</td><td>sv12_Im</td></tr><tr><td></td><td>sv12_Abs</td></tr><tr><td></td><td>sv12_Phase</td></tr></table>

Table 40 PSD data in AC data file, PSD Tcl array element, and dataset variables   

<table><tr><td>Coefficient of PSD matrix</td><td>PSD variable in AC data file</td><td>PSD Tcl array element</td><td>Dataset variables</td></tr><tr><td rowspan="4">SV21(f,v)</td><td>ReS_VXV(2,1)</td><td>rfx::SV(0,2,1,$if,$iv)</td><td>sv21_Re</td></tr><tr><td>ImS_VXV(2,1)</td><td>rfx::SV(1,2,1,$if,$iv)</td><td>sv21_Im</td></tr><tr><td></td><td></td><td>sv21_Abs</td></tr><tr><td></td><td></td><td>sv21_Phase</td></tr><tr><td>SV22(f,v)</td><td>S_V(2)</td><td>rfx::SV(2,2)</td><td>sv22</td></tr><tr><td colspan="4">The matrix GR V,n with coefficients corresponding to electron NVSD due to monopolar GR LNS (a partial PSD)</td></tr><tr><td>GR,11(v, v)</td><td>S_V_eeMonoGR(1)</td><td>rfx::SVeeMonoGR(0,1,1,$if,$iv)</td><td>sv11(eeMonoGR)</td></tr><tr><td rowspan="4">GR,12(v, v)</td><td>-</td><td>rfx::SVeeMonoGR(0,1,2,$if,$iv)</td><td>sv12_Re(eeMonoGR)</td></tr><tr><td></td><td>rfx::SVeeMonoGR(1,1,2,$if,$iv)</td><td>sv12_Im(eeMonoGR)</td></tr><tr><td></td><td></td><td>sv12_Abs(eeMonoGR)</td></tr><tr><td></td><td></td><td>sv12_Phase(eeMonoGR)</td></tr><tr><td rowspan="4">GR,21(v, v)</td><td>ReS_VXV_eeMonoGR(2,1)</td><td>rfx::SVeeMonoGR(0,2,1,$if,$iv)</td><td>sv21_Re(eeMonoGR)</td></tr><tr><td></td><td>rfx::SVeeMonoGR(1,2,1,$if,$iv)</td><td>sv21_Im(eeMonoGR)</td></tr><tr><td>ImS_VXV_eeMonoGR(2,1)</td><td></td><td>sv21_Abs(eeMonoGR)</td></tr><tr><td></td><td></td><td>sv21_Phase(eeMonoGR)</td></tr><tr><td>GR,22(v, v)</td><td>S_V_eeMonoGR(2)</td><td>rfx::SVeeMonoGR(0,2,2,$if,$iv)</td><td>sv22(eeMonoGR)</td></tr></table>

# rfx::Export

Exports the AC array, or the Y-, h-, Z-, or S-matrix, to a CSV file.

# Syntax

```snap
rfx::Export -rfmatrix "AC" | "Y" | "H" | "Z" | "S" [-file <fileName>] [-xaxis "frequency" | "bias"] [-info 0 | 1 | 2 | 3] [-help 0 | 1] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-rfmatrix &quot;AC&quot; | &quot;Y&quot; | &quot;H&quot; | &quot;Z&quot; | &quot;S&quot;</td><td>Name of the RF matrix. (String, no default)</td></tr><tr><td>-file &lt;fileName&gt;</td><td>Name of the CSV file. Default: &quot;rfmatrix.csv&quot;</td></tr><tr><td>-xaxis &quot;frequency&quot; | &quot;bias&quot;</td><td>Specifies either the frequency or the bias as the axis. Selects the sorting order. For example, for -xaxis &quot;frequency&quot;, the data is printed using a loop with frequency as the inner variable and bias as the outer variable. Default: &quot;frequency&quot;</td></tr><tr><td>-info 0 | 1 | 2 | 3</td><td>Sets local information level. Default: 0</td></tr><tr><td>-help 0 | 1</td><td>Prints a help screen if set to 1. Default: 0</td></tr></table>

# Returns

None.

# Example

```batch
Create AC matrix and Y-matrix.  
rfx::Load -dataset "ACPLT_nMOS" -file "DATA/nMOS_ac_des.plt" \port1 1 -port2 2 -biasport "v(1)" -devicewidth 0.9  
rfx::Export -file "Sparam_freq.csv" -rfmatrix "S" -axis "frequency" 
```

# Note:

The CSV file can be loaded into any spreadsheet application. It contains a header that lists the number of bias and frequency points as well as the value of the first and last bias and frequency points. The header is followed by a table, which contains the frequency, the bias, and the real and imaginary parts of the elements of the RF matrix.

Two versions of the CSV file can be written. One is sorted by frequencies and the other is sorted by bias points. The keyword -xaxis specifies whether the parameters should be sorted by frequency first (-xaxis "frequency"), with bias being the secondary parameter, or by bias first (-xaxis "bias") with frequency being the secondary parameter. For example, the CSV file Sparam_freq.csv generated by the rfx::Export command in the above example contains the following (for -xaxis "bias", the first two columns are reversed):

```csv
of bias pts. : 21, first bias: 0, last bias: 1  
# of frequencies: 25, first freq: 1e+08, last freq: 1e+12  
bias,freq,S11_Re,S11_Im,S12_Re,S12_Im,S21_Re,S21_Im,S22_Re,S22_Im  
0,1e+08,0.9991,-2.38e-05,0.00089,1.08e-05,0.00084,1.08e-05,0.999, -1.9774e-05, 0,1.47e+08,0.9991,-3.50e-05,0.000899,1.58e-05,0.00084, 1.58e-05,0.999,-2.90e-05  
0,2.15e+08,0.999,-5.14e-05,0.000899,2.32e-05,0.00084, 2.32e-05,0.9991,-4.26e-05  
... 
```

# rfx::GetFK1

Computes the cutoff frequency for stability $f _ { K 1 }$ (see Cutoff Frequency for Stability on page 519) at all bias points from the Rollett stability factor versus frequency curves. Creates the corresponding datasets if the keyword -dataset is specified.

# Note:

If $f _ { K 1 }$ is not found, then the procedure returns 0.

# Syntax

```rust
rfx::GetFK1 -out <array_name> [-dataset <dataName>] [-xscale "lin" | "log"] [-scale <r>] [-target <r>] [-occurrence <i>] [-info 0 | 1 | 2 | 3] [-help 0 | 1] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-out &lt;array_name&gt;</td><td>Name of an array to store the results. The array has one string-valued index. The index contains the elements fK1 and bias. The values of the fK1 element and the bias element are lists of fK1 and bias, respectively. (Array name, no default)</td></tr><tr><td>-dataset &lt;dataName&gt;</td><td>Name of Sentaurus Visual dataset containing the variables bias and fK1. The variable bias contains a list of bias values, and the variable fK1 contains a list of cutoff frequencies for stability. These variables can be used to plot a fK1 versus bias curve. The dataset is created only if this keyword is specified. (String, no default)</td></tr><tr><td>-xscale "lin" | "log"</td><td>Specifies whether the values on the x-axis are linearly or logarithmically distributed. Default: "log"</td></tr><tr><td>-scale &lt;r&gt;</td><td>Computed fK1 is divided by this scaling factor. Use to convert, for example, the fK1 value to GHz. (Real number, default: 1.0)</td></tr><tr><td>-target &lt;r&gt;</td><td>Selects the value of K that should be looked for. (Real number, default: 1.0)</td></tr><tr><td>-occurrence &lt;i&gt;</td><td>Specifies the n-th interpolated fK1 value to be extracted. Use this if multiple frequencies have the same K-value (specified using the keyword -target) at a bias point. (Integer, default: 1)</td></tr><tr><td>-info 0 | 1 | 2 | 3</td><td>Sets local information level. Default: 0</td></tr><tr><td>-help 0 | 1</td><td>Prints a help screen if set to 1. Default: 0</td></tr></table>

# Returns

None.

# Example

```tcl
# Create AC matrix and Y-matrix
rfx::Load -dataset "ACPLT_nMOS" -file "DATA/nMOS_ac_des.plt" \
-port1 1 -port2 2 -biasport "v(1)" -devicewidth 0.9
# Compute fK1 versus bias and corresponding dataset
rfx::GetFK1 -out FK -dataset "fK.bias" -xscale "log" \
-target 1.0 -occurrence 1 -scale 1e9
puts "Bias Points: $FK(bias)"
puts "Cutoff frequencies for stability [GHz]: $FK(fK1)" 
```

# rfx::GetFmax

Computes the maximum frequency of oscillation fmax $f _ { \mathrm { m a x } }$ at all bias points from the power gain (MUG or MAG) versus frequency curves at each bias point. Creates the corresponding datasets if the keywords dataset and slopedataset are specified.

# Note:

This procedure can compute $f _ { \mathrm { m a x } }$ using three different methods (see Extraction Methods for ft and fmax on page 517). If $f _ { \mathrm { m a x } }$ is not found, or the power gain is less than or equal to 1 (device is passive), the procedure returns 0.

# Syntax

```rust
rfx::GetFmax -out <array_name> -parameter <r> [-method <string>] [-dataset <dataName>] [-slopedataset <dataName>] [-powergain "MUG" | "MAG"] [-xscale "lin" | "log"] [-scale <r] [-info 0 | 1 | 2 | 3] [-help 0 | 1] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-out</td><td>Name of an array to store the results. The array has one string-valued index. The index contains the elements fmax and bias. The values of the fmax element and the bias element are lists of fmax and bias, respectively. (Array name, no default)</td></tr><tr><td>-parameter</td><td>The dB point for method "b", specified in units of dB, or the frequency point in units of Hz for method "c". This is a mandatory argument if method "b" or "c" is used. (Real number, no default)</td></tr><tr><td>-method</td><td>Specifies the method to use for computing fmax (see Extraction Methods for ft and fmax on page 517): 
• "a" or "unit-gain-point" extracts fmax as the frequency at which power gain equals one. 
• "b" or "extract-at-dbpoint" extracts fmax by extrapolating the power gain from the point at which it has fallen by a certain number of decibels (called the dB point) from its initial value. 
• "c" or "extract-at-frequency" is the same as "b", but the power gain is extrapolated from the specified frequency point. (String, default: "a")</td></tr><tr><td>-dataset &lt;dataName&gt;</td><td>Name of Sentaurus Visual dataset containing the variables bias and fmax. The variable bias contains a list of bias values, and the variable fmax contains a list of fmax values. These variables can be used to plot a fmax versus bias curve. The dataset is created only if -dataset is specified. (String, no default)</td></tr><tr><td>-slopedataset &lt;dataName&gt;</td><td>Name of Sentaurus Visual dataset containing the variables "bias&lt;i&gt; frequency" and "bias&lt;i&gt; dMUG" (-powergain "MUG") or "bias&lt;i&gt; dMAG" (-powergain "MAG") corresponding to the bias point bias&lt;i&gt;. i is the bias point index. These variables are created for all the bias point indices (0 to rfx::i.biasend). The variable frequency contains a list of frequency values, and the variables dMUG and dMAG contain a list of derivatives of MUG and MAG, respectively as a function of frequency. The unit of the power gain derivatives is dB/decade. These variables are used to plot the power gain derivative versus frequency curve for various bias points. The dataset is created only if -slopedataset is specified. (String, no default)</td></tr><tr><td>-powergain "MUG" | "MAG"</td><td>Selects the power gain used for extracting fmax. (String, default: "MUG")</td></tr><tr><td>-xscale "lin" | "log"</td><td>Specifies whether the values on the x-axis are linearly or logarithmically distributed. Default: "log"</td></tr><tr><td>-scale &lt;r&gt;</td><td>Computed fmax is divided by this scaling factor. Use to convert, for example, the fmax value to GHz. (Real number, default: 1.0)</td></tr><tr><td>-info 0 | 1 | 2 | 3</td><td>Sets local information level. Default: 0</td></tr><tr><td>-help 0 | 1</td><td>Prints a help screen if set to 1. Default: 0</td></tr></table>

# Returns

None.

# Example

```txt
Create AC matrix and Y-matrix  
rfx::Load -dataset "ACPLT_nMOS" -file "DATA/nMOS_ac_des.plt" \port1 1-port2 2-biasport "v(1)" -devicewidth 0.9  
# Compute fmax versus bias. Create dMUG versus frequency  
# and fmax versus bias datasets  
rfx::GetFmax -out Fmax0 -method "unit-gain-point" -scale 1e9 \-xscale "log" -dataset "fmax0.bias" -slopedataset "MUG_slope_freq" 
```

```tcl
puts "Bias Points: $Fmax0(bias)"  
puts "Max frequency of oscillation: $Fmax0(fmax)"  
#-> Bias Points: 0 0.05 0.10 0.15 0.20 0.25 0.30 ...  
#-> Max frequency of oscillation: 0.0 0.0 0.0 0.0 172.24 417.31 640.89 ... 
```

# rfx::GetFt

Computes the cutoff frequency $f _ { \mathrm { t } }$ at all bias points from the current gain $\left| h _ { 2 1 } \right|$ versus frequency curves at each bias point. Creates the corresponding datasets if the keywords dataset and slopedataset are specified.

# Note:

This procedure can compute $f _ { \mathrm { t } }$ using three different methods (see Extraction Methods for ft and fmax on page 517). If $f _ { \mathrm { t } }$ is not found or $\left| h _ { 2 1 } \right| \leq 1$ , the procedure returns 0.

# Syntax

```txt
rfx::GetFt -out <array_name> -parameter <r> [-method <string>]  
[-dataset <dataName>] [-slopedataset <dataName>]  
[-xscale "lin" | "log"] [-scale <r>]  
[-info 0 | 1 | 2 | 3] [-help 0 | 1] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-out</td><td>Name of an array to store the results. The array has one string-valued index. The index contains the elements ft and bias. The values of the ft element and the bias element are lists of ft and bias, respectively. (Array name, no default)</td></tr><tr><td>-parameter</td><td>The dB point for method "b", specified in units of dB, or the frequency point in units of Hz for method "c". This is a mandatory argument if method "b" or "c" is used. (Real number, no default)</td></tr><tr><td>-method</td><td>Specifies the method to use for computing ft (see Extraction Methods for ft and fmax on page 517): 
· "a" or "unit-gain-point" extracts ft as the frequency at which |h21| = 0 dB. 
· "b" or "extract-at-dbpoint" extracts ft by extrapolating |h21| from the point at which |h21| has fallen by a certain number of decibels (called the dB point) from its initial value. 
· "c" or "extract-at-frequency" is the same as "b", but |h21| is extrapolated from the specified frequency point. 
(String, default: "a")</td></tr><tr><td>-dataset</td><td>Name of Sentaurus Visual dataset containing the variables bias and ft. The variable bias contains a list of bias values, and the variable ft contains a list of ft values. These variables can be used to plot a ft versus bias curve. The dataset is created only if -dataset is specified. (String, no default)</td></tr><tr><td>-slopedataset</td><td>Name of Sentaurus Visual dataset containing the variables "bias&lt;i&gt; frequency" and "bias&lt;i&gt; dh21" corresponding to the bias point bias&lt;i&gt;. i is the bias point index. These variables are created for all the bias point indices (0 to rfx::i.biasend). The variable frequency contains a list of frequency values, and the variable dh21 contains a list of the derivatives of |h21| as a function of frequency. The unit of dh21 is dB/decade. It can be used to plot the derivatives of |h21| versus frequency curve at various bias points. The slope dataset is created only if -slopedataset is specified. (String, no default)</td></tr><tr><td>-xscale "lin" | "log"</td><td>Specifies whether the values on the x-axis are linearly or logarithmically distributed. Default: "log"</td></tr><tr><td>-scale</td><td>Computed ft is divided by this scaling factor. Use to convert, for example, the ft value to GHz. (Real number, default: 1.0)</td></tr><tr><td>-info 0 | 1 | 2 | 3</td><td>Sets local information level. Default: 0</td></tr><tr><td>-help 0 | 1</td><td>Prints a help screen if set to 1. Default: 0</td></tr></table>

# Returns

None.

# Example

```tcl
# Create AC matrix and Y-matrix
rfx::Load -dataset "ACPLT_nMOS" -file "DATA/nMOS_ac_des.plt" \
-port1 1 -port2 2 -biasport "v(1)" -devicewidth 0.9
# Compute ft versus bias
#Create dh21 versus frequency and ft versus bias datasets
rfx::GetFt -out Ft0 -method "unit-gain-point" -scale 1e9 -xscale "log" \
-dataset "ft0.bias" -slopedataset "h21_slope_freq"
puts "Cutoff frequencies: $Ft0(ft)"
puts "Bias Points: $Ft0(bias)"
#-> Cutoff frequencies: 0 0.05 0.10 0.15 0.2 0.25 ...
#-> Bias Points: 0.0 0.0 0.0 4.30 25.84 74.21 ... 
```

# rfx::GetNearestIndex

Finds the index of the entry in an ordered numeric list that is closest to the given target. For example, this procedure can find the index of a frequency or bias point closest to a frequency or bias point of interest (see Tcl Arrays rfx::AC and rfx::Y on page 507).

# Note:

If the target is outside the range of values in the numeric list, this procedure returns the index of the first element or the last element in the numeric list.

Therefore, if the frequency or bias point is outside the range of frequency or bias values, this procedure returns the index of the first element or the last element in the list of frequency or bias values.

# Syntax

```erlang
rfx::GetNearestIndex -out <var_name> -target <r> -list <list_of_r> [-info 0 | 1 | 2 | 3] [-help 0 | 1] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-out</td><td>Variable name to store the index.</td></tr><tr><td>-target</td><td>Target value. (Real number, no default)</td></tr><tr><td>-list</td><td>An ordered numeric list. The list can be in ascending or descending order. (List of real numbers, no default)</td></tr><tr><td>-info 0 | 1 | 2 | 3</td><td>Sets local information level. Default: 0</td></tr><tr><td>-help 0 | 1</td><td>Prints a help screen if set to 1. Default: 0</td></tr></table>

# Returns

None.

# Example

```batch
Create AC matrix and Y-matrix  
rfx::Load -dataset "ACPLT_nMOS" -file "DATA/nMOS_ac_des.plt" \port1 1 -port2 2 -biasport "v(1)" 
```

```tcl
# Ex 1: Get nearest bias index corresponding to 0.025 V
rfx::GetNearestIndex -out i.bias -target 0.025 -list $rfx::bias
puts "Nearest bias point index: $i.bias"
set BiasPoint [lindex $rfx::bias $i.bias]
puts "Corresponding bias point: $BiasPoint" 
```

```txt
Nearest bias point index: 0  
Corresponding bias point: 0 
```

```tcl
# Ex 2: Get nearest frequency index corresponding to 1e9 Hz
rfx::GetNearestIndex -out i_freq -target 1e9 -list $rfx::freq
puts "Nearest frequency index: $i_freq"
set Frequency [lindex $rfx::freq $i_freq]
puts "Corresponding frequency: $Frequency" 
```

```txt
Nearest frequency index: 6  
Corresponding frequency: 1.00e+09 
```

# rfx::GetNoiseFigure

Computes the noise figure, the noise parameters, the input-referred spectral densities, and several other parameters as a function of frequency or bias:

Noise figure (using Equation 94 on page 523) and minimum noise figure NF NFmin $N F _ { \mathrm { m i n } }$ (using Equation 93 on page 523)   
Noise factor $F$ (using Equation 92 on page 523) and minimum noise factor $F _ { \mathrm { m i n } }$ (using Equation 91 on page 522)   
Equivalent noise resistance $R _ { n }$ (using Equation 76 on page 520) and conductance $G _ { n }$ (using Equation 82 on page 521)   
Optimum source admittance $Y _ { \mathrm { o p t } }$ (using Equation 87 and Equation 88 on page 522) and impedance $Z _ { \mathrm { o p t } }$ (using Equation 90 on page 522)   
Equivalent noise conductance $G _ { u }$ (using Equation 78 on page 521) and correlation admittance $Y _ { \mathrm { c o r } }$ (using Equation 80 on page 521)   
• Normalized quantities $r _ { n } , g _ { n } , y _ { \mathrm { o p t } } , z _ { \mathrm { o p t } }$ , and $g _ { u }$   
Input-referred spectral densities $S _ { \nu _ { n } }$ (using Equation 75 on page 520), $S _ { \nu , \bar { i } . }$ (using Equation 83 on page 521), $S _ { i _ { n } \overline { { \nu _ { n } } } }$ (using Equation 83), andn $S _ { i _ { n } }$ (using Equation 81 on vnin page 521)   
Noise correlation coefficients $C _ { i _ { n } }$ (using Equation 41 on page 510) and $C _ { i _ { n } \nu _ { n } }$ (using Equation 84 on page 522)

# Note:

This procedure uses the rfx namespace variables rfx::zo and rfx::Zs (see Characteristic Impedance and Source Impedance on page 525).

# Syntax

```txt
rfx::GetNoiseFigure -out <array_name> [-xaxis "frequency" | "bias"]  
(-target <r> | -index <i>) [-dataset <dataName>]  
[-info 0 | 1 | 2 | 3] [-help 0 | 1] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-out</td><td>Name of an array to store the results. The array has one string-valued index. The index contains the elements summarized in Table 41, which also summarizes the values of these elements. The index also contains the element freq (for -xaxis "frequency") or bias (for -xaxis "bias"). (Array name, no default)</td></tr><tr><td>-xaxis "frequency" | "bias"</td><td>Specifies either the frequency or bias as the axis. Default: "frequency"</td></tr><tr><td>-target &lt;r&gt;</td><td>Bias point (for -xaxis "frequency") or frequency point (for -xaxis "bias"). Specify only one of the keywords -target or -index. (Real number, no default)</td></tr><tr><td>-index &lt;i&gt;</td><td>Index of the bias point (for -xaxis "frequency") or frequency point (for -xaxis "bias"). Specify only one of the keywords -target or -index. (Integer, no default)</td></tr><tr><td>-dataset &lt;dataName&gt;</td><td>Name of Sentaurus Visual dataset containing the variables summarized in Table 41. The dataset also contains the variable frequency (for -xaxis "frequency") or bias (for -xaxis "bias"). (String, no default)</td></tr><tr><td>-info 0 | 1 | 2 | 3</td><td>Sets local information level. Default: 0</td></tr><tr><td>-help 0 | 1</td><td>Prints a help screen if set to 1. Default: 0</td></tr></table>

Table 41 Elements of array index, dataset variable names, and their values   

<table><tr><td>Elements of array index</td><td>Dataset variable name</td><td>Value</td></tr><tr><td>NF, F, NFmin, Fmin</td><td>NF, F, NFmin, Fmin</td><td>Noise figure, noise factor, minimum noise figure, and minimum noise factor.</td></tr><tr><td>Rn, Gn, rn, gn</td><td>Rn, Gn, rn, gn</td><td>Equivalent noise resistance Rnand conductance Gn, and their normalized values rnand gn.</td></tr><tr><td>Gopt, Bopt, Ropt, Xopt, gopt, bopt, ropt, xopt</td><td>Gopt, Bopt, Ropt, Xopt, gopt, bopt, ropt, xopt</td><td>Optimum source conductance, susceptance, resistance, and reactance, and their normalized values.</td></tr><tr><td>Gcor, Bcor</td><td>Gcor, Bcor</td><td>Correlation conductance and susceptance.</td></tr><tr><td>Gu, gu</td><td>Gu, gu</td><td>Equivalent conductance Guand its normalized values gu.</td></tr><tr><td>ReCi, ImCi, AbsCi, PhaseCi</td><td>Ci_Re, Ci_Im, Ci_Abs, Ci_Phase</td><td>Real and imaginary parts, absolute value, and phase of Ci_n.</td></tr></table>

Table 41 Elements of array index, dataset variable names, and their values   

<table><tr><td>Elements of array index</td><td>Dataset variable name</td><td>Value</td></tr><tr><td>Sv, ReSvi, ImSvi, ReSiv, ImSiv, Si</td><td>Sv, Svi_Re, Svi_Im, Siv_Re, Siv_Im, Si</td><td>SVn, real and imaginary parts of SVn-1n, real and imaginary parts of Si-n, and Si_n.</td></tr><tr><td>ReCiv, ImCiv, AbsCiv, PhaseCiv</td><td>Civ_Re, Civ_Im, Civ_Abs, Civ_Phase</td><td>Real and imaginary parts, absolute value, and phase of Cin-vn.</td></tr></table>

# Returns

None.

# Example

```batch
Create AC-matrix, Y-matrix and PSD matrices  
rfx::Load -dataset "ACPLT_nMOS" -file "DATA/nMOS_noise_ac_des.plt" \port1 1 -port2 2 -biasport "v(1)" 
```

```txt
# Compute noise parameters, noise figure and input-referred # spectral densities at 0 bias, as a function of frequency rfx::GetNoiseFigure -out NFparam -dataset "NF_freq" \ -xaxis "frequency" -target 0.0 
```

```txt
puts "frequency: $NFparam(freq)"  
puts "NF: $NFparam(NF)"  
puts "NFmin: $NFparam(NFmin)"  
puts "Rn: $NFparam(Rn)"  
puts "Gopt: $NFparam(Gopt)"  
puts "Bopt: $NFparam(Bopt)"  
puts "Sv: $NFparam(Sv)"  
puts "Si: $NFparam(Si)"  
puts "ReSvi: $NFparam(ReSvi)"  
puts "ImSvi: $NFparam(ImSvi)"  
#-> frequency: 0.1 0.215 0.464 ...  
#-> NF: 113.501 113.501 113.501 ...  
#-> NFmin: 5.310e-07 1.144e-06 2.465e-06 ...  
#-> Rn: 1.120e13 1.120e13 1.120e13 ...  
#-> Gopt: 5.460e-21 1.176e-20 2.534e-20 ...  
#-> Bopt: -2.198e-16 -4.736e-16 -1.020e-15 ...  
#-> Sv: 1.793e-07 1.793e-07 1.793e-07 ...  
#-> Si: 8.666e-39 4.022e-38 1.867e-37 ...  
#-> ReSvi: -1.083e-36 -5.029e-36 -2.334e-35 ...  
#-> ImSvi: -3.942e-23 -8.493e-23 -1.830e-22 ... 
```

# rfx::GetParsAtPoint

Accesses the RF parameters of an RF matrix at a given bias and frequency point.

# Syntax

```txt
rfx::GetParsAtPoint -out <array_name>  
-rfmatrix "AC" | "Y" | "H" | "Z" | "S"  
-biaspoint <r> -freqpoint <r>  
[-info 0 | 1 | 2 | 3] [-help 0 | 1] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-out</td><td>Name of an array to store the results. The array has one string-valued index. The index contains the elements bias, freq, 11, 12, 21, and 22. The values of the bias element and the freq element are the bias and the frequency point, respectively. The 11, 12, 21, and 22 elements are the complex RF parameters (list containing real and imaginary parts). (Array name, no default)</td></tr><tr><td>-rfmatrix &quot;AC&quot; | &quot;Y&quot; | &quot;H&quot; | &quot;Z&quot; | &quot;S&quot;</td><td>Name of the RF matrix. (String, no default)</td></tr><tr><td>-biaspoint &lt;r&gt;</td><td>Bias point. (Real number, no default)</td></tr><tr><td>-freqpoint &lt;r&gt;</td><td>Frequency point. (Real number, no default)</td></tr><tr><td>-info 0 | 1 | 2 | 3</td><td>Sets local information level. Default: 0</td></tr><tr><td>-help 0 | 1</td><td>Prints a help screen if set to 1. Default: 0</td></tr></table>

# Returns

None.

# Example

```tcl
# Create AC- and Y-matrix
rfx::Load -dataset "ACPLT_nMOS" -file "DATA/nMOS_ac_des.plt" \
-port1 1 -port2 2 -biasport "v(1)" -devicewidth 0.9
# Compute AC parameters at first bias point and frequency
set BiasPoint [lindex $rfx::bias 0]
set Frequency [lindex $rfx::freq 0]
rfx::GetParsAtPoint -out ReImData -rfmatrix "AC" \
-biaspoint $BiasPoint -freqpoint $Frequency
puts "Bias Point: $ReImData(bias)"
puts "Freq Point: [format %.2e $ReImData(freq)]" 
```

```txt
puts "ac11: $ReImData(11)"  
puts "ac12: $ReImData(12)"  
puts "ac21: $ReImData(21)"  
puts "ac22: $ReImData(22)"  
#-> Bias Point: 0  
#-> Freq Point: 1.00e+08  
#-> ac11: 9.00e-06 3.80e-16  
#-> ac12: -9.00e-06 -1.72e-16  
#-> ac21: -8.41e-06 -1.72e-16  
#-> ac22: 9.08e-06 3.15e-16 
```

# rfx::GetPowerGain

Computes the following as a function of frequency (at a fixed bias point) or bias (at a fixed frequency point):

Rollett stability factor (using Equation 51) and stability condition delta (using Equation 52)   
• MSG (using Equation 54) (linear scale as well as 10 dB scale)   
• MAG (using Equation 55 and Equation 56) (linear scale as well as 10 dB scale)   
• MUG (using Equation 57) (linear scale as well as 10 dB scale)   
• Unilateral figure of merit (using Equation 58)

# Note:

If the denominator in Equation 51, Equation 54, Equation 57, or Equation 58 is 0, the procedure returns a value of $\mathrm { 1 0 } ^ { 2 0 }$

If MUG, MSG, or MAG is 0, the procedure returns a value of .10–20 ${ 1 0 } ^ {  { - } 2 0 }$

# Syntax

```txt
rfx::GetPowerGain -out <array_name> [-axis "frequency" | "bias"]  
(-target <r> | -index <i>) [-dataset <dataName>]  
[-powergain "all" | "MUG" | "MSG" | "MAG"]  
[-info 0 | 1 | 2 | 3] [-help 0 | 1] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-out &lt;array_name&gt;</td><td>Name of an array to store the results. The array has one string-valued index. The index contains the elements K, delta, and freq (for -xaxis "frequency") or bias (for -xaxis "bias"). The values of the K, delta, freq, and bias elements are the Rollett stability factor, the stability condition delta, the frequency, and the bias, respectively. In addition, for -powergain "all", the index contains the elements MUG, MUG_dB, MSG, MSG_dB, MAG, MAG_dB, and U. These are MUG (linear scale), MUG (10 dB scale), MSG (linear scale), MSG (10 dB scale), MAG (linear scale), MAG (10 dB scale), and Uf, respectively. For -powergain "MUG", only the MUG, MUG_dB, and U elements are created. For -powergain "MSG", only the MSG and MSG_dB elements are created. For -powergain "MAG", only the MAG and MAG_dB elements are created. (Array name, no default)</td></tr><tr><td>-xaxis "frequency" | "bias"</td><td>Specifies either the frequency or bias as the axis. Default: "frequency"</td></tr><tr><td>-target &lt;r&gt;</td><td>Bias point (for -xaxis "frequency") or frequency point (for -xaxis "bias"). Specify only one of the keywords -target or -index. (Real number, no default)</td></tr><tr><td>-index &lt;i&gt;</td><td>Index of the bias point (for -xaxis "frequency") or frequency point (for -xaxis "bias"). Specify only one of the keywords -target or -index. (Integer, no default)</td></tr><tr><td>-dataset &lt;dataName&gt;</td><td>Name of Sentaurus Visual dataset containing the variables K, delta, and frequency (for -xaxis "frequency") or bias (for -xaxis "bias"). In addition, for -powergain "all", the variables MSG, MSG_dB, MAG, MAG_dB, MUG, MUG_dB, and U are created. For -powergain "MUG", the variables MUG, MUG_dB, and U are created. For -powergain "MSG", the variables MSG and MSG_dB are created. For -powergain "MAG", the variables MAG and MAG_dB are created. (String, no default)</td></tr><tr><td>-powergain "all" | "MUG" | "MSG" | "MAG"</td><td>Specifies the power gains to compute: 
• For -powergain "all", MSG, MAG, MUG, and U are computed. 
• For -powergain "MUG", only MUG and U are computed. 
• For -powergain "MSG", only MSG is computed. 
• For -powergain "MAG", only MAG is computed. 
Power gains are computed on both the linear scale and 10 dB scale. 
(String, default: "all")</td></tr><tr><td>-info 0 | 1 | 2 | 3</td><td>Sets local information level. Default: 0</td></tr><tr><td>-help 0 | 1</td><td>Prints a help screen if set to 1. Default: 0</td></tr></table>

# Returns

None.

# Example

```tcl
# Create AC matrix and Y-matrix
rfx::Load -dataset "ACPLT_nMOS" -file "DATA/nMOS_trunc_ac_des.plt" \
-port1 1 -port2 2 -biasport "v(1)" -devicewidth 0.9
# Compute stability factor and power gain at 1e8 Hz,
# as a function of bias
rfx::GetPowerGain -out gain -dataset "Pgain_freq" -powergain "all" \
-xaxis "bias" -target 0.0
puts "Bias Points: $gain(bias)"
puts "K: $gain(K)"
puts "delta: $gain(dx)"puts "MSG: $gain(MSG)"
puts "MSG_dB: $gain(MSG_dB)"
puts "MAG: $gain(MAG)"
puts "MAG_dB: $gain(MAG_dB)"
puts "MUG: $gain(MUG)"
puts "MUG_dB: $gain(MUG_dB)"
puts "U: $gain(U)"
#-> Bias Points: 0 0.1 ...
#-> K: 0.18019 0.0161 ...
#-> delta: 0.99999 0.99992 ...
#-> MSG: 5.55723 62.92755 ...
#-> MSG_dB: 7.44858 17.98841 ...
#-> MAG: 5.55723 62.92755 ...
#-> MAG_dB: 7.44858 17.98841 ...
#-> MUG: -102686.50144 -1218108.32141 ...
#-> MUG_dB: 50.11513 60.85686 ...
#-> U: 66383.57685 134797.56995 ... 
```

# rfx::Load

Loads a Sentaurus Device AC data file and creates a Sentaurus Visual dataset. It also creates the Tcl arrays, rfx::AC and rfx::Y (see Tcl Arrays rfx::AC and rfx::Y on page 507), along with several rfx namespace variables summarized in Table 37 on page 523. The Tcl arrays for the power spectral densities are created only if the AC data file contains PSD data (see Power Spectral Density Tcl Arrays on page 511).

# Syntax

```txt
rfx::Load -file <fileName> [-biasport <stringValue>] [-biassportsign +1 | -1] [-dataset <dataName>] [-devicewidth <r>] [-port1 <integer | stringValue>] [-port2 <integer | stringValue>] [-info 0 | 1 | 2 | 3] [-help 0 | 1] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-file</td><td>Name of the Sentaurus Device AC data file. (String, no default)</td></tr><tr><td>-biasport</td><td rowspan="2">Name of biased port. For example, &quot;v(1)&quot; for voltage on port or node 1, or &quot;i(vc,2)&quot; for current flowing out of the voltage source vc at port or node 2. (String, default: &quot;v(1)&quot;)</td></tr><tr><td>&lt;stringValue&gt;</td></tr><tr><td>-biassportsign +1 | -1</td><td>Sign of the bias port. Used to reverse the polarity of the bias. Default: +1</td></tr><tr><td>-dataset</td><td>Name of the created dataset. It contains the data from the Sentaurus Device AC data file. (String, default: &quot;ACPLT&quot;)</td></tr><tr><td>-devicewidth</td><td>Device width multiplier (device width in the z-direction, Lz; see Device Width Scaling for 2D Structures on page 512) in μm. (Real number, default: 1.0)</td></tr><tr><td>-port1</td><td rowspan="2">Name of the input port of the two-port network. The port name must agree with the node names defined in the Sentaurus Device System section. (Integer or string, default: 1)</td></tr><tr><td>stringValue&gt;</td></tr><tr><td>-port2</td><td rowspan="2">Name of the output port of the two-port network. The port name must agree with the node names defined in the Sentaurus Device System section. (Integer or string, default: 2)</td></tr><tr><td>stringValue&gt;</td></tr><tr><td>-info 0 | 1 | 2 | 3</td><td>Sets local information level. Default: 0</td></tr><tr><td>-help 0 | 1</td><td>Prints a help screen if set to 1. Default: 0</td></tr></table>

# Returns

None.

# Example

```tcl
# Create AC matrix and Y-matrix
rfx::Load -dataset "ACPLT_nMOS" -file "DATA/nMOS_ac_des.plt" \
-port1 1 -port2 2 -biasport "v(1)" -devicewidth 0.9
# rfx namespace variables
puts "Number of bias points: $rfx::nbias"
puts "Bias points: $rfx::bias"
puts "Number of frequencies: $rfx::nfreq"
puts "Frequencies: $rfx::freq"
# Print the Y-matrix
set biases [get_variable_data v(1) -dataset ACPLT]
foreach P1 {1 2} {
foreach P2 {1 2} {
set if 0 ;# Frequency index
set iv 0 ;# Bias point index
foreach Bias $biases {
puts "Frequency: [lindex $rfx::freq $if]"
puts "Bias point: [lindex $rfx::bias $iv]"
puts "Y(0,$P1,$P2,$if,$iv): $rfx::Y(0,$P1,$P2,$if,$iv)"
puts "Y(1,$P1,$P2,$if,$iv): $rfx::Y(0,$P1,$P2,$if,$iv)"
if { $iv < [expr $rfx::nbias-1]} {
incr iv}
else if { $if < [expr $rfx::nfreq-1]} {
incr if
set iv 0
}
}
}
}
# -> Number of bias points: 21
# -> Bias points: 0 0.05 0.1 0.15 ...
# -> Number of frequencies: 25
# -> Frequencies: 1e+08 1.47e+08 2.15e+08 ...
# -> Frequency: 1e+08
# -> Bias point: 0
# -> Y(0,1,1,0,0): 9.00e-06
# -> Y(1,1,1,0,0): 9.00e-06
# -> Frequency: 1e+08
# -> Bias point: 0.05
# -> Y(0,1,1,0,1): 9.00e-06
# -> Y(1,1,1,0,1): 9.00e-06 
```

# Note:

It is assumed that the Sentaurus Device AC data file contains one or more frequency sweeps with a voltage bias or current bias as the control variable.

The keyword -biasport defines which port is biased and whether the biasing is a voltage or a current condition. For a current condition, the syntax for biasport is more complex. For example, if the name of the current source is vc and the name of the port is 2, -biasport is specified as -biasport "i(vc,2)".

In this case, however, Sentaurus Device must also be instructed to include the current at this node through this device in the Sentaurus Device AC data file. This is performed in the System section of the Sentaurus Device input file with. For example:

System{ HBT hbt (base $= 1$ collector $= 2$ emitter $= 0$ Vsource_pset vb(10){dc $= 0$ Vsource_pset vc（20）{dc $= 0$ ACPlot(v(1)v(2)i(vb1)i(vc2))   
}

Internally, the arrays rfx::AC and rfx::Y use the port numbers 1 and 2 corresponding to port1 and port2 as array indices (see Tcl Arrays rfx::AC and rfx::Y on page 507). This convention is also valid for the PSD Tcl arrays.

# rfx::NoiseFigure

Computes the noise figure, the noise parameters, the power spectral densities, and other parameters at a fixed frequency and bias point:

Noise figure (using Equation 94 on page 523) and minimum noise figureNF $N F _ { \mathrm { m i n } }$ (using Equation 93 on page 523)   
Noise factor $F$ (using Equation 92 on page 523) and minimum noise factor $F _ { \mathrm { m i n } }$ (using Equation 91 on page 522)   
Equivalent noise resistance $R _ { n }$ (using Equation 76 on page 520) and conductance $G _ { n }$ (using Equation 82 on page 521)   
Optimum source admittance $Y _ { \mathrm { o p t } }$ (using Equation 87 and Equation 88 on page 522) and impedance $Z _ { \mathrm { o p t } }$ (using Equation 90 on page 522)   
Equivalent noise conductance $G _ { u }$ (using Equation 78 on page 521) and correlation admittance $Y _ { \mathrm { c o r } }$ (using Equation 80 on page 521)   
• Normalized quantities $r _ { n } , g _ { n } , y _ { \mathrm { o p t } } , z _ { \mathrm { o p t } }$ $z _ { \mathrm { o p t } }$ , and $g _ { u }$

Input-referred spectral densities $S _ { \nu _ { n } }$ (using Equation 75 on page 520), $S _ { \nu , \bar { i } . }$ (using Equation 83 on page 521), $S _ { i _ { n } \nu _ { n } }$ (using Equation 83), andn $S _ { i _ { n } }$ (using Equation 81 on vnin page 521)   
Noise correlation coefficients $C _ { i _ { n } }$ (using Equation 41 on page 510) and $C _ { i _ { n } \nu _ { n } }$ (using Equation 84 on page 522)

# Note:

This procedure uses the rfx namespace variables rfx::zo and rfx::Zs (see Characteristic Impedance and Source Impedance on page 525).

# Syntax

rfx::NoiseFigure SI11 SI12 SI22 Y11 Y21

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>SI11 SI12 SI22</td><td>The coefficients S11, S12, and S22 of the complex NISD matrix for a fixed frequency and bias point in the form of three lists. Each list contains the real and imaginary parts. (List of real numbers, no default)</td></tr><tr><td>Y11 Y21</td><td>The complex elements Y11 and Y21 of the Y-matrix for a fixed frequency and bias point in the form of two lists. Each list contains the real and imaginary parts. (List of real numbers, no default)</td></tr></table>

# Returns

An array having one string-valued index. The index contains elements summarized in Table 41 on page 541, which also summarizes the values of these elements.

# Example

```tcl
set SI11 [list 8.24593987e-23 0.0]  
set SI12 [list -3.91285654e-23 -1.08922612e-23]  
set SI22 [list 4.57789473e-23 0.0]  
set Y11 [list 0.00613324387 0.0170027533]  
set Y21 [list -0.00506706586 -0.0060744537]  
rfx::NoiseFigure $SI11 $SI12 $SI22 $Y11 $Y21  
puts "NF: $NFparameters(NF)"  
puts "NFmin: $NFparameters(NFmin)"  
puts "Rn: $NFparameters(Rn)"  
puts "Gopt: [lindex $NFparameters(Yopt) 0]"  
puts "Bopt: [lindex $NFparameters(Yopt) 1]"  
puts "Sv: $NFparameters(Sv)"  
puts "Si: $NFparameters(Si)"  
puts "ReSvi: [lindex $NFparameters(Svi) 0]"  
puts "ImSvi: [lindex $NFparameters(Svi) 1]" 
```

```txt
#-> NF: 4.21
#-> NFmin: 3.19
#-> Rn: 45.68
#-> Gopt: 0.0086
#-> Bopt: -0.011
#-> Sv: 7.32e-19
#-> Si: 1.36e-22
#-> ReSvi: 2.38e-21
#-> ImSvi: -7.76e-21 
```

# rfx::PolarBackdrop

Creates a ruled background on which RF parameters in polar coordinates are plotted. Creates two families of curves: a set of concentric circles and a set of angular lines.

# Syntax

```txt
rfx::PolarBackdrop -plot <plotName> -r <list_of_r> -phi <list_of_r> [-dataset <dataName>] [-color <stringValue>] [-linestyle <stringValue>] [-linewidth <r>] [-info 0 | 1 | 2 | 3] [-help 0 | 1] 
```

```haskell
Argument Description   
-plot <plotName> Name of the polar plot. (String, no default)   
-r <list_of_r> A list of increasing radial values. (List of real numbers, no default)   
-phi <list_of_r> A list of increasing angular values. (List of real numbers, no default)   
-dataset <dataName> Name of the dataset used to create the polar background. (String, default: "PolarBackdrop")   
-color <stringValue> Sets the color of the curves of the polar background. (String, default: "black")   
-linestyle <stringValue> Sets the style of the curve lines of the polar background. (String, default: "dash")   
-linewidth <r> Sets the line width of the curve lines of the polar background. (Real number, default: 2.0)   
-info 0 | 1 | 2 | 3 Sets local information level. Default: 0   
-help 0 | 1 Prints a help screen if set to 1. Default: 0 
```

# Returns

None.

# Example

```tcl
set Rs [list 0.25 0.5 0.75 1.0 1.25]
set This [list 0 30 60 90 120 150]
rfx::PolarBackdrop -plot Plot_Polar -r $Rs -phi $This 
```

# rfx::PowerGain

Computes the following at a fixed bias and frequency point:

Rollett stability factor (using Equation 51) and stability condition delta (using Equation 52)   
• MSG (using Equation 54) (linear scale)   
• MAG (using Equation 55 and Equation 56) (linear scale)   
• MUG (using Equation 57) (linear scale)   
• Unilateral figure of merit (using Equation 58)

# Syntax

```txt
rfx::PowerGain S11 S12 S21 S22 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>S11 S12 S21 S22</td><td>The complex S-matrix for a fixed frequency and bias point in the form of four lists. Each list contains the real and imaginary parts of an element Sij of the S-matrix. (List of real numbers, no default)</td></tr></table>

# Returns

The Rollett stability factor, the stability condition delta, MSG, MAG, MUG, and $U _ { \mathrm { f } }$ at a fixed frequency and bias point in the form of a list.

# Example

```tcl
set S11 [list 0.999999877967 -8.36457327936e-05]
set S12 [list -1.20947562066e-07 1.09859319808e-05]
set S21 [list -0.0536108305232 4.08872504539e-05]
set S22 [list 0.997240784695 -2.17611978854e-05]
set Pgain [rfx::PowerGain $S11 $S12 $S21 $S22] 
```

```batch
puts "K: [lindex $Pgain 0]" 
```

```txt
puts "delta: [lindex $Pgain 1]"  
puts "MSG: [lindex $Pgain 2]"  
puts "MAG: [lindex $Pgain 3]"  
puts "MUG: [lindex $Pgain 4]"  
puts "U: [lindex $Pgain 5]"  
#-> K: -0.009  
#-> delta: 0.997  
#-> MSG: 4879.658  
#-> MAG: 4879.658  
#-> MUG: -116265.652  
#-> U: 449.598 
```

# rfx::RFCList

Accesses a slice of the Y-, h-, Z-, S-matrix, or PSD matrices, typically, to generate a curve of an RF parameter or PSD as a function of bias or frequency.

# Syntax

```txt
rfx::RFCList -out <array_name> -rfparameter <string> -index <i> [-noisename <string>] [-noisesource "ee" | "hh" | "eeDiff" | "hhDiff" | "eeMonoGR" | "hhMonoGR" | "eeFlickerGR" | "hhFlickerGR"] [-xaxis "frequency" | "bias"] [-info 0 | 1 | 2 | 3] [-help 0 | 1] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-out</td><td>Name of an array to store the results. The array has one string-valued index. The index contains the elements Re and Im. The values of the Re element and the Im element are lists of the real part and imaginary part, respectively, of the RF parameter. (Array name, no default)</td></tr><tr><td>-rfparameter</td><td rowspan="2">Parameter identifier. Use, for example, the notation h21 for the h-matrix element h21. For PSDs, use sv&lt;ij&gt; or si&lt;ij&gt;. Here, ij refers to the port numbers (11, 12, 21, 22). In addition, for partial noise spectral density, use the -noisesource keyword. (String, no default)</td></tr><tr><td>&lt;string&gt;</td></tr><tr><td>-index</td><td>Selects the index of the slice. (Integer, no default)</td></tr><tr><td>-noisename</td><td>Name of the noise specification. Required only for -rfparameter sv&lt;ij&gt; or si&lt;ij&gt;, and when a named noise specification was used to perform noise analysis. (String, default: ")</td></tr><tr><td>-noiseresource "ee" | "hh" | "eeDiff" | "hhDiff" | "eeMonoGR" | "hhMonoGR" | "eeFlickerGR" | "hhFlickerGR"</td><td>Name of the noise source. Only used for accessing the matrices of partial PSDs. For -rfparameter si&lt;ij&gt;, the only allowed values of this keyword are "ee" and "hh". (String, no default)</td></tr><tr><td>-xaxis "frequency" | "bias"</td><td>Specifies either the frequency or bias as the axis. Default: "frequency"</td></tr><tr><td>-info 0 | 1 | 2 | 3</td><td>Sets local information level. Default: 0</td></tr><tr><td>-help 0 | 1</td><td>Prints a help screen if set to 1. Default: 0</td></tr></table>

# Returns

None.

# Example

# For $\mathtt { v } = 0 \ . \ 5$ , return real and imaginary parts of z11 as a function # of frequency

# Create AC matrix and Y-matrix rfx::Load -dataset "ACPLT_nMOS" -file "DATA/nMOS_ac_des.plt" \ -port1 1 -port2 2 -biasport "v(1)" -devicewidth 0.9

rfx::GetNearestIndex -out i_bias -target 0.5 -list $rfx::bias puts "Nearest bias point index: $i_bias" set BiasPoint [lindex $rfx::bias $i_bias] puts "Corresponding bias point: $BiasPoint"

rfx::RFCList -out ReImz11 -rfparameter "z11" -xaxis "frequency" \ -index $i_bias puts "Re(ReImz11): $ReImz11(Re)" puts "Im(ReImz11): $ReImz11(Im)"

#-> Nearest bias point index: 10 #-> Corresponding bias point: 0.5 #-> Re(ReImz11): 10748.32 10746.14 10741.47 #-> Re(ReImz11): -138.16 -202.74 -297.45 ...

# rfx::SmithBackdrop

Creates a Smith chart–ruled background on which RF parameters are plotted. Creates two families of curves: the normalized resistance circles and the normalized reactance (capacitive or inductive) arcs.

# Syntax

```txt
rfx::SmithBackdrop -plot <plotName> -r <list_of_r> -x <list_of_r> [-dataset <dataName>] [-color <stringValue>] [-linestyle <stringValue>] [-linewidth <r>] [-info 0 | 1 | 2 | 3] [-help 0 | 1] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-plot &lt;plotName&gt;</td><td>Name of the Smith chart. (String, no default)</td></tr><tr><td>-r &lt;list_of_r&gt;</td><td>A list of normalized resistance values. The list must contain positive values, which monotonically increase. (List of real numbers, no default)</td></tr><tr><td>-x &lt;list_of_r&gt;</td><td>A list of normalized reactance values. The list must contain nonzero positive values, which monotonically increase. (List of real numbers, no default)</td></tr><tr><td>-dataset &lt;dataName&gt;</td><td>Name of dataset used to create the Smith chart background. (String, default: &quot;SmithBackdrop&quot;)</td></tr><tr><td>-color &lt;stringValue&gt;</td><td>Sets the color of the curves of the Smith chart background. (String, default: &quot;black&quot;)</td></tr><tr><td>-linestyle &lt;stringValue&gt;</td><td>Sets the style of the curve lines of the Smith chart background. (String, default: &quot;dash&quot;)</td></tr><tr><td>-linewidth &lt;r&gt;</td><td>Sets the line width of the curve lines of the Smith chart background. (Real, default: 2.0)</td></tr><tr><td>-info 0 | 1 | 2 | 3</td><td>Sets local information level. Default: 0</td></tr><tr><td>-help 0 | 1</td><td>Prints a help screen if set to 1. Default: 0</td></tr></table>

# Returns

None.

# Example

```tcl
set Rs [list 0 0.3333 1.0 3.0]
set Xs [list 0.268 0.575 1 1.73 3.75]
rfx::SmithBackdrop -plot Plot_Smith -r $Rs -x $Xs
```

# rfx::Y2H

Converts Y-parameters to h-parameters at a fixed frequency and bias point using Equation 46 on page 513.

# Syntax

```txt
rfx::Y2H Y11 Y12 Y21 Y22 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>Y11 Y12 Y21 Y22</td><td>The complex Y-matrix for a fixed frequency and bias point in the form of four lists. Each list contains the real and imaginary parts of an element Yij of the Y-matrix. (List of real numbers, no default)</td></tr></table>

# Returns

The complex h-matrix at the fixed frequency and bias point in the form of four lists. Each list contains the real and imaginary parts of an element $h _ { i j }$ of the h-matrix.

# Example

```tcl
set Y11 [list 1.21582e-09 8.33508513295e-07]  
set Y12 [list 1.21693e-09 -1.10011034906e-07]  
set Y21 [list 0.000536849 -3.81214675594e-07]  
set Y22 [list 2.76303e-05 2.15260671987e-07] 
```

```tcl
set H [rfx::Y2H $Y11 $Y12 $Y21 $Y22]
puts "h11= [lindex $H 0]"
puts "h12= [lindex $H 1]"
puts "h21= [lindex $H 2]"
puts "h22= [lindex $H 3]" 
```

```txt
---> h11 = 1750.04 -1199745.24
---> h12 = 0.13 0.0017
---> h21 = 0.48 -644.08
---> h22 = 9.85e-05 1.05e-06 
```

# rfx::Y2S

Converts Y-parameters to S-parameters at a fixed frequency and bias point using Equation 47 on page 513. The S-parameters are computed using a characteristic impedance value that defaults to $5 0 ~ \Omega$ .

# Note:

This procedure uses the variable $\mathtt { r f x } \colon : \mathtt { z } 0$ (see Characteristic Impedance and Source Impedance on page 525).

# Syntax

```txt
rfx::Y2S Y11 Y12 Y21 Y22 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>Y11 Y12 Y21 Y22</td><td>The complex Y-matrix for a fixed frequency and bias point in the form of four lists. Each list contains the real and imaginary parts of an element Yij of the Y-matrix. (List of real numbers, no default)</td></tr></table>

# Returns

The complex S-matrix in the form of four lists at a fixed frequency and bias point. Each list contains the real and imaginary parts of an element $S _ { i j }$ of the S-matrix.

# Example

```tcl
set rfx::z0 100.0
set Y11 [list 1.21582e-09 8.33508513295e-07]
set Y12 [list 1.21693e-09 -1.10011034906e-07]
set Y21 [list 0.000536849 -3.81214675594e-07]
set Y22 [list 2.76303e-05 2.15260671987e-07]
set S [rfx::Y2S $Y11 $Y12 $Y21 $Y22]
puts "S11= [lindex $S 0]"
puts "S12= [lindex $S 1]"
puts "S21= [lindex $S 2]"
puts "S22= [lindex $S 3]"
#-> S11= 0.9999997 -0.00017
#-> S12= -2.40e-07 2.19e-05
#-> S21= -0.11 8.73e-05
#-> S22= 0.99 -4.40e-05 
```

# rfx::Y2Z

Converts Y-parameters to Z-parameters at a fixed frequency and bias point using Equation 49 on page 514.

# Syntax

```txt
rfx::Y2Z Y11 Y12 Y21 Y22 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>Y11 Y12 Y21 Y22</td><td>The complex Y-matrix for a fixed frequency and bias point in the form of four lists. Each list contains the real and imaginary parts of an element Yij of the Y-matrix. (List of real numbers, no default)</td></tr></table>

# Returns

The complex Z-matrix in the form of four lists at a fixed frequency and bias point. Each list contains the real and imaginary parts of an element $Z _ { i j }$ of the Z-matrix.

# Example

```tcl
set Y11 [list 1.21582e-09 8.33508513295e-07]  
set Y12 [list 1.21693e-09 -1.10011034906e-07]  
set Y21 [list 0.000536849 -3.81214675594e-07]  
set Y22 [list 2.76303e-05 2.15260671987e-07] 
```

```tcl
set Z [rfx::Y2Z $Y11 $Y12 $Y21 $Y22]] 
```

```tcl
puts "Z11= [lindex $Z 0]"  
puts "Z12= [lindex $Z 1]"  
puts "Z21= [lindex $Z 2]"  
puts "Z22= [lindex $Z 3]" 
```

```txt
#-> z11 = -482.36 -336580.47
#-> z12 = 1340.15 2.46
#-> z21 = 64960.88 6539151.68
#-> z22 = 10152.58 -108.46 
```

# Complex Arithmetic Support

This section describes procedures for performing complex arithmetic. For most procedures, the RF extraction library contains two versions of a procedure: scalar and vectorial. The name of the scalar version of a procedure ends with c, and the name of the corresponding vectorial version ends with v.

The scalar version operates on a single complex number or two complex numbers. A complex number is specified using a Tcl list containing the real and imaginary parts of the complex number. For example, the absolute value of the complex number, $z = 4 + 3 i$ can be computed using the procedure rfx::Abs_c as follows:

```perl
set z [list 4 3]  
puts [rfx::Abs_c $z]  
#-> 5.0 
```

The vectorial version operates on either a single list of complex numbers or two lists of complex numbers. The list of complex numbers is specified using arrays that have one string-valued index. The index contains the elements Re and Im. The values of the Re element and the Im element are the real and imaginary parts, respectively, of the list of complex numbers. For example, the absolute values of the complex numbers $z _ { 1 } = 2 + 3 i$ and $z _ { 2 } = - 1 + i$ can be computed using the procedure rfx::Abs_v as follows:

```tcl
set Z(Re) [list 2 -1]  
set Z(Im) [list 3 1]  
rfx::Abs_v -out abs_vals -z Z  
puts "abs values = $abs_vals"  
#-> abs values = 3.606 1.414 
```

All the procedures except rfx::Polar2Cart_c and rfx::Polar2Cart_v operate on complex numbers specified in Cartesian coordinates. The rfx::Polar2Cart procedures operate on a complex number or a list of complex numbers specified in polar coordinates, which are represented by a Tcl list or an array, respectively. For example, the complex number $\sqrt { 2 } \dot { \angle 4 5 ^ { \circ } }$ is specified using:

```txt
set z [list 1.414 45] 
```

# rfx::Abs_c

Computes the absolute value of a complex number.

# Syntax

```autohotkey
rfx::Abs_c z 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>z</td><td>A list containing the real and imaginary parts of a complex number. 
(List of real numbers, no default)</td></tr></table>

# Returns

A single value, the absolute value of a complex number.

# Example

```perl
set z [list 4 3]  
puts [rfx::Abs_c $z]  
#-> 5.0 
```

# rfx::Abs_v

Computes the absolute values of a list of complex numbers, and also computes the absolute values in units of 10 dB or 20 dB.

# Syntax

```rust
rfx::Abs_v -out <list_name> -z <array_name> [-dB 0 | 10 | 20] [-info 0 | 1 | 2 | 3] [-help 0 | 1] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-out</td><td>Name of a list to store the list of absolute values. (List name, no default)</td></tr><tr><td>-z</td><td>Name of an array containing a list of complex numbers. The array has one string-valued index. The index contains the elements Re and Im. The values of the Re element and the Im element are the real and imaginary parts, respectively, of the complex numbers. (Array name, no default)</td></tr><tr><td>-dB 0 | 10 | 20</td><td>Specifies the decibel level for absolute values. If -dB is not specified or -dB 0 is specified, absolute values are computed on the linear scale. Default: 0</td></tr><tr><td>-info 0 | 1 | 2 | 3</td><td>Sets local information level. Default: 0</td></tr><tr><td>-help 0 | 1</td><td>Prints a help screen if set to 1. Default: 0</td></tr></table>

# Returns

None.

# Example

```tcl
set Z(Re) [list 1 1 0 -1 -1 -1 0 1]
set Z(Im) [list 0 1 1 1 0 -1 -1 -1]
rfx::Abs_v -out abs_vals -z Z
puts "abs values = $abs_vals"
#-> abs values = 1.0 1.414 1.0 1.414 1.0 1.414 1.0 1.414
set Z(Re) [list 0 0 0 0 0]
set Z(Im) [list 1e0 1e1 1e2 1e3 1e4]
rfx::Abs_v -out dBs -z Z -dB 10
puts "dBs= $dBs"
#-> 0.0 10.0 20.0 30.0 40.0 
```

# rfx::Abs2_c

Computes the square of the absolute value of a complex number.

# Syntax

```txt
rfx::Abs2_c z 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>z</td><td>A list containing the real and imaginary parts of a complex number. (List of real numbers, no default)</td></tr></table>

# Returns

A single value, the square of the absolute value of a complex number.

# Example

```perl
set z [list 4 3]  
puts [rfx::Abs2_c $z]  
#-> 25 
```

# rfx::Abs2_v

Computes the square of the absolute value of a list of complex numbers.

# Syntax

```rust
rfx::Abs2_v -out <list_name> -z <array_name> [-info 0 | 1 | 2 | 3] [-help 0 | 1] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-out</td><td>Name of a list to store the list of the square of absolute values. (List name, no default)</td></tr><tr><td>-z</td><td>Name of an array containing list of complex numbers. The array has one string-valued index. The index contains the elements Re and Im. The values of the Re element and the Im element are the real and imaginary parts, respectively, of the complex numbers. (Array name, no default)</td></tr><tr><td>-info 0 | 1 | 2 | 3</td><td>Sets local information level. Default: 0</td></tr><tr><td>-help 0 | 1</td><td>Prints a help screen if set to 1. Default: 0</td></tr></table>

# Returns

None.

# Example

```tcl
set Z(Re) [list 1 1 0 -1 -1 -1 0 1]
set Z(Im) [list 0 1 1 1 0 -1 -1 -1]
rfx::Abs2_v -out abs2 -z Z
puts "square of abs values = $abs2"
#-> square of abs values = 1.0 2.0 1.0 2.0 1.0 2.0 1.0 2.0 
```

# rfx::Add_c

Adds two complex numbers.

# Syntax

```txt
rfx::Add_c z1 z2 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>z1 z2</td><td>Two lists, each containing the real and imaginary parts of a complex number. (List of real numbers, no default)</td></tr></table>

# Returns

A list containing the real and imaginary parts of the sum (a complex number).

# Example

```tcl
set z1 [list 1 0]  
set z2 [list 0 1]  
puts [rfx::Add_c $z1 $z2]  
#-> 1 1 
```

# rfx::Add_v

Adds two lists of complex numbers.

# Syntax

```perl
rfx::Add_v -out <array_name> -z1 <array_name> -z2 <array_name> [-info 0 | 1 | 2 | 3] [-help 0 | 1] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-out &lt;array_name&gt;</td><td>Name of an array to store the results. The array has one string-valued index. The index contains the elements Re and Im. The values of the Re element and the Im element are the real and imaginary parts, respectively, of the sum of the list of complex numbers specified using the keywords -z1 and -z2. (Array name, no default)</td></tr><tr><td>-z1 &lt;array_name&gt;</td><td>Name of an array containing a list of complex numbers. The array has one string-valued index. The index contains the elements Re and Im. The values of the Re element and the Im element are the real and imaginary parts of the complex numbers, respectively. (Array name, no default)</td></tr><tr><td>-z2 &lt;array_name&gt;</td><td>Name of an array containing a list of complex numbers. The array has one string-valued index. The index contains the elements Re and Im. The values of the Re element and the Im element are the real and imaginary parts of the complex numbers, respectively. (Array name, no default)</td></tr><tr><td>-info 0 | 1 | 2 | 3</td><td>Sets local information level. Default: 0</td></tr><tr><td>-help 0 | 1</td><td>Prints a help screen if set to 1. Default: 0</td></tr></table>

# Returns

None.

# Example

```rust
set Z1(Re) [list 0 1]
set Z1(Im) [list 1 2]
set Z2(Re) [list 1 2]
set Z2(Im) [list 3 4]
rfx::Add_v -out Z -z1 Z1 -z2 Z2
puts "Z(Re) = $Z(Re)""
puts "Z(Im) = $Z(Im)""
#-> Z(Re) = 1 3
#-> Z(Im) = 4 6 
```

# rfx::Cart2Polar_c

Converts a complex number from Cartesian to polar coordinates.

# Syntax

```txt
rfx::Cart2Polar_c z 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>z</td><td>A list containing the real and imaginary parts of a complex number. (List of real numbers, no default)</td></tr></table>

# Returns

A list containing the absolute value and the phase of the complex number.

# Example

```tcl
set z [list 1 1]
set polar [rfx::Cart2Polar_c $z]
puts "abs value = [format %.3f [lindex $polar 0]]"
puts "phase = [lindex $polar 1]"
#-> abs value = 1.414
#-> phase = 45.0 
```

# rfx::Cart2Polar_v

Converts a list of complex numbers from Cartesian to polar coordinates.

# Syntax

```txt
rxf::Cart2Polar_v -out <array_name> -z <array_name> [-info 0 | 1 | 2 | 3] [-help 0 | 1] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-out</td><td>Name of an array to store the results. The array has one string-valued index. The index contains the elements Abs and Phase. The values of the Abs element and the Phase element are the absolute value and the phase, respectively, of the list complex numbers specified using the keyword -z. (Array name, no default)</td></tr><tr><td>-z &lt;array_name&gt;</td><td>Name of an array containing a list of complex numbers. The array has one string-valued index. The index contains the elements Re and Im. The values of the Re element and the Im element are the real and imaginary parts, respectively, of the list of complex numbers. (Array name, no default)</td></tr><tr><td>-info 0 | 1 | 2 | 3</td><td>Sets local information level. Default: 0</td></tr><tr><td>-help 0 | 1</td><td>Prints a help screen if set to 1. Default: 0</td></tr></table>

# Returns

None.

# Example

```txt
set Z(Re) [list 1 1 0 -1 -1 -1 0 1]
set Z(Im) [list 0 1 1 1 0 -1 -1 -1]
rfx::Cart2Polar_v -out polar -z Z
puts "abs values = $polar(Abs)"
puts "phases = $polar(Phase)"
#-> abs values = 1.0 1.414 1.0 1.414 1.0 1.414 1.0 1.414
#-> phases = 0.0 45.0 89.999 135.0 180.0 -135.0 -89.999 -45.0 
```

# rfx::Conj_c

Computes the complex conjugate of a complex number.

# Syntax

```txt
rfx::Conj_c z 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>z</td><td>A list containing the real and imaginary parts of a complex number. (List of real numbers, no default)</td></tr></table>

# Returns

A list containing the real and imaginary parts of the complex conjugate.

# Example

```tcl
set z [list 1 1]  
puts [rfx::Conj_c $z]  
#-> 1 -1 
```

# rfx::Conj_v

Computes the complex conjugate of a list of complex numbers.

# Syntax

```txt
rxf::Conj_v -out <array_name> -z <array_name> [-info 0 | 1 | 2 | 3] [-help 0 | 1] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-out &lt;array_name&gt;</td><td>Name of an array to store the results. The array has one string-valued index. The index contains the elements Re and Im. The values of the Re element and the Im element are the real and imaginary parts, respectively, of the complex conjugate of the list of complex numbers specified using the keyword -z. (Array name, no default)</td></tr><tr><td>-z &lt;array_name&gt;</td><td>Name of an array containing a list of complex numbers. The array has one string-valued index. The index contains the elements Re and Im. The values of the Re element and the Im element are the real and imaginary parts, respectively, of the complex numbers. (Array name, no default)</td></tr><tr><td>-info 0 | 1 | 2 | 3</td><td>Sets local information level. Default: 0</td></tr><tr><td>-help 0 | 1</td><td>Prints a help screen if set to 1. Default: 0</td></tr></table>

# Returns

None.

# Example

```txt
set Z(Re) [list 1 1]
set Z(Im) [list -1 1]
rfx::Conj_v -out Conj -z Z
puts "Real part of complex conjugate= $Conj(Re)""
puts "Imaginary part of complex conjugate= $Conj(Im)"'
#-> Real part of complex conjugate= 1 1
#-> Imaginary part of complex conjugate= 1 -1 
```

# rfx::Div_c

Divides two complex numbers.

# Syntax

```txt
rfx::Div_c z1 z2 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>z1 z2</td><td>Two lists, each containing the real and imaginary parts of a complex number. (List of real numbers, no default)</td></tr></table>

# Returns

A list containing the real and imaginary parts of the quotient (a complex number).

# Example

```tcl
set z1 [list 4 0]
set z2 [list 0 2]
puts [rfx::Div_c $z1 $z2]
#-> 0.0 -2.0 
```

# rfx::Div_v

Divides two lists of complex numbers.

# Syntax

```perl
rfx::Div_v -out <array_name> -z1 <array_name> -z2 <array_name> [-info 0 | 1 | 2 | 3] [-help 0 | 1] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-out &lt;array_name&gt;</td><td>Name of an array to store the results. The array has one string-valued index. The index contains the elements Re and Im. The values of the Re element and the Im element are the real and imaginary parts, respectively, of the quotient of the list of complex numbers specified using the keywords -z1 and -z2. (Array name, no default)</td></tr><tr><td>-z1 &lt;array_name&gt;</td><td>Name of an array containing a list of complex numbers. The array has one string-valued index. The index contains the elements Re and Im. The values of the Re element and the Im element are the real and imaginary parts of the complex numbers, respectively. (Array name, no default)</td></tr><tr><td>-z2 &lt;array_name&gt;</td><td>Name of an array containing a list of complex numbers. The array has one string-valued index. The index contains the elements Re and Im. The values of the Re element and the Im element are the real and imaginary parts of the complex numbers, respectively. (Array name, no default)</td></tr><tr><td>-info 0 | 1 | 2 | 3</td><td>Sets local information level. Default: 0</td></tr><tr><td>-help 0 | 1</td><td>Prints a help screen if set to 1. Default: 0</td></tr></table>

# Returns

None.

# Example

```tcl
set Z1(Re) [list 4 4]
set Z1(Im) [list 7 2]
set Z2(Re) [list 1 3]
set Z2(Im) [list -3 -1]
rfx::Div_v -out Z -z1 Z1 -z2 Z2
puts "Z(Re) = $Z(Re)""
puts "Z(Im) = $Z(Im)"
#-> Z(Re) = -1.7 1.0
#-> Z(Im) = 1.9 1.0 
```

# rfx::Im_c

Computes the imaginary part of a complex number.

# Syntax

```txt
rfx::Im_c z 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>z</td><td>A list containing the real and imaginary parts of a complex number. 
(List of real numbers, no default)</td></tr></table>

# Returns

A single value, the imaginary part of a complex number.

# Example

```perl
set z [list 1 2]  
puts [rfx::Im_c $z]  
#-> 2 
```

# rfx::Mul_c

Multiplies two complex numbers.

# Syntax

```txt
rfx::Mul_c z1 z2 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>z1 z2</td><td>Two lists, each containing the real and imaginary parts of a complex number. (List of real numbers, no default)</td></tr></table>

# Returns

A list containing the real and imaginary parts of the product (a complex number).

# Example

```tcl
set z1 [list 1 0]
set z2 [list 0 1]
puts [rfx::Mul_c $z1 $z2]
#-> 0 1 
```

# rfx::Mul_v

Multiplies two lists of complex numbers.

# Syntax

```perl
rfx::Mul_v -out <array_name> -z1 <array_name> -z2 <array_name> [-info 0 | 1 | 2 | 3] [-help 0 | 1] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-out</td><td>Name of an array to store the results. The array has one string-valued index. The index contains the elements Re and Im. The values of the Re element and the Im element are the real and imaginary parts, respectively, of the product of the list of complex numbers specified using the keywords -z1 and -z2. (Array name, no default)</td></tr><tr><td>-z1 &lt;array_name&gt;</td><td>Name of an array containing a list of complex numbers. The array has one string-valued index. The index contains the elements Re and Im. The values of the Re element and the Im element are the real and imaginary parts of the complex numbers, respectively. (Array name, no default)</td></tr><tr><td>-z2 &lt;array_name&gt;</td><td>Name of an array containing a list of complex numbers. The array has one string-valued index. The index contains the elements Re and Im. The values of the Re element and the Im element are the real and imaginary parts of the complex numbers, respectively. (Array name, no default)</td></tr><tr><td>-info 0 | 1 | 2 | 3</td><td>Sets local information level. Default: 0</td></tr><tr><td>-help 0 | 1</td><td>Prints a help screen if set to 1. Default: 0</td></tr></table>

# Returns

None.

# Example

```perl
set Z1(Re) [list 4 4]
set Z1(Im) [list 7 2]
set Z2(Re) [list 1 3]
set Z2(Im) [list -3 -1]
rfx::Mul_v -out Z -z1 Z1 -z2 Z2
puts "Z(Re) = $Z(Re)""
puts "Z(Im) = $Z(Im)""
#-> Z(Re) = 25 14
#-> Z(Im) = -5 2 
```

# rfx::Mulsc_c

Multiplies a scalar and a complex number.

# Syntax

```txt
rfx::Mulsc_c c z 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>c</td><td>A real number. (Real number, no default)</td></tr><tr><td>z</td><td>A list containing the real and imaginary parts of a complex number. (List of real numbers, no default)</td></tr></table>

# Returns

A list containing the real and imaginary parts of the product (a complex number) of the scalar and the complex number.

# Example

```tcl
set c 5.0
set z [list 2.0 3.0]
puts [rfx::Mulsc_c $c $z]
#-> 10.0 15.0 
```

# rfx::Phase_c

Computes the principal value of the phase (in degrees, in the interval $( - 1 8 0 ^ { \circ } , 1 8 0 ^ { \circ } ] )$ of a complex number specified in Cartesian coordinates.

# Syntax

```autohotkey
rfx::Phase_c z 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>z</td><td>A list containing the real and imaginary parts of a complex number. (List of real numbers, no default)</td></tr></table>

# Returns

A single value, the phase of a complex number.

# Example

```txt
set z [list 1 1]  
puts [rfx::Phase_c $z]  
#-> 45.0 
```

# rfx::Phase_v

Computes the principal value of the phase (in degrees, in the interval $( - 1 8 0 ^ { \circ } , 1 8 0 ^ { \circ } ] )$ of a list of complex numbers specified in Cartesian coordinates.

# Syntax

```txt
rfx::Phase_v -out <list_name> -z <array_name> [-info 0 | 1 | 2 | 3] [-help 0 | 1] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-out</td><td>Name of a list to store the list of phases. (List name, no default)</td></tr><tr><td>-z</td><td>Name of an array containing a list of complex numbers. The array has one string-valued index. The index contains the elements Re and Im. The values of the Re element and the Im element are the real and imaginary parts, respectively, of the complex numbers. (Array name, no default)</td></tr><tr><td>-info 0 | 1 | 2 | 3</td><td>Sets local information level. Default: 0</td></tr><tr><td>-help 0 | 1</td><td>Prints a help screen if set to 1. Default: 0</td></tr></table>

# Returns

None.

# Example

```tcl
set Z(Re) [list 1 1 0 -1 -1 -1 0 1]
set Z(Im) [list 0 1 1 1 0 -1 -1 -1]
rfx::Phase_v -out phases -z Z
puts "phases = $phases"
#->phases = 0.0 45.0 89.999 135.0 180.0 -135.0 -89.999 -45.0 
```

# rfx::Polar2Cart_c

Converts a complex number from polar to Cartesian coordinates.

# Syntax

```txt
rfx::Polar2Cart_c z 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>z</td><td>A list containing the absolute value and the phase of a complex number. (List of real numbers, no default)</td></tr></table>

# Returns

A list containing the real and imaginary parts of a complex number.

# Example

```txt
set z [list 1.414 45]
set ReIm [rfx::Polar2Cart_c $z]
puts "Real part = [lindex $ReIm 0]"
puts "Imaginary part = [lindex $ReIm 1]"
#-> Real part = 0.999
#-> Imaginary part = 0.999 
```

# rfx::Polar2Cart_v

Converts a list of complex numbers from polar to Cartesian coordinates.

# Syntax

```txt
rfx::Polar2Cart_v -out <array_name> -z <array_name> [-info 0 | 1 | 2 | 3] [-help 0 | 1] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-out</td><td>Name of an array to store the results. The array has one string-valued index. The index contains the elements Re and Im. The values of the Re element and the Im element are the real and imaginary parts, respectively, of the list of complex numbers specified using the keyword -z. (Array name, no default)</td></tr><tr><td>-z &lt;array_name&gt;</td><td>Name of an array containing a list of complex numbers. The array has one string-valued index. The index contains the elements Abs and Phase. The values of the Abs element and the Phase element are the absolute value and the phase (in degrees), respectively, of the list of complex numbers. 
(Array name, no default)</td></tr><tr><td>-info 0 | 1 | 2 | 3</td><td>Sets local information level. Default: 0</td></tr><tr><td>-help 0 | 1</td><td>Prints a help screen if set to 1. Default: 0</td></tr></table>

# Returns

None.

# Example

```tcl
set Z(Abs) [list 1.414 1]
set Z(Phase) [list 45 60]
rfx::Polar2Cart_v -out ReIm -z Z
puts "Real part = $ReIm(Re)""
puts "Imaginary part = $ReIm(Im)"'
#-> Real part = 0.999 0.5
#-> Imaginary part = 0.999 0.866 
```

# rfx::Re_c

Computes the real part of a complex number.

# Syntax

```txt
rfx::Re_c z 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>z</td><td>A list containing the real and imaginary parts of a complex number. (List of real numbers, no default)</td></tr></table>

# Returns

A single value, the real part of a complex number.

# Example

```tcl
set z [list 1 2]
puts [rfx::Re_c $z]
#-> 1 
```

# rfx::Sign

Computes the sign of a real number.

# Syntax

```txt
rfx::Sign r1 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>r1</td><td>A real value. (Real number, no default)</td></tr></table>

# Returns

A single value, the sign of a real number.

# Example

```txt
puts [rfx::Sign -2]  
#-> -1.0 
```

# rfx::Sub_c

Subtracts two complex numbers.

# Syntax

```txt
rfx::Sub_c z1 z2 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>z1 z2</td><td>Two lists, each containing the real and imaginary parts of a complex number. (List of real numbers, no default)</td></tr></table>

# Returns

A list containing the real and imaginary parts of the difference (a complex number).

# Example

```tcl
set z1 [list 1 0]
set z2 [list 0 1]
puts [rfx::Sub_c $z1 $z2]
#-> 1 -1 
```

# rfx::Sub_v

Subtracts two lists of complex numbers.

# Syntax

```perl
rfx::Sub_v -out <array_name> -z1 <array_name> -z2 <array_name> [-info 0 | 1 | 2 | 3] [-help 0 | 1] 
```

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>-out</td><td>Name of an array to store the results. The array has one string-valued index. The index contains the elements Re and Im. The values of the Re element and the Im element are the real and imaginary parts, respectively, of the difference of the list of complex numbers specified using the keywords -z1 and -z2. (Array name, no default)</td></tr><tr><td>-z1</td><td>Name of an array containing a list of complex numbers. The array has one string-valued index. The index contains the elements Re and Im. The values of the Re element and the Im element are the real and imaginary parts of the complex numbers, respectively. (Array name, no default)</td></tr><tr><td>-z2 &lt;array_name&gt;</td><td>Name of an array containing a list of complex numbers. The array has one string-valued index. The index contains the elements Re and Im. The values of the Re element and the Im element are the real and imaginary parts of the complex numbers, respectively. (Array name, no default)</td></tr><tr><td>-info 0 | 1 | 2 | 3</td><td>Sets local information level. Default: 0</td></tr><tr><td>-help 0 | 1</td><td>Prints a help screen if set to 1. Default: 0</td></tr></table>

# Returns

None.

# Example

```perl
set Z1(Re) [list 1 1]
set Z1(Im) [list 0 2]
set Z2(Re) [list 0 2]
set Z2(Im) [list 1 4]
rfx::Sub_v -out Z -z1 Z1 -z2 Z2
puts "Z(Re) = $Z(Re)""
puts "Z(Im) = $Z(Im)"
#-> Z(Re) = 1 -1
#-> Z(Im) = -1 -2 
```

# lib::SetInfoDef

Sets the default information level.

# Note:

Level 0: Warning, error, or status messages only.

Level 1: Echo results.

Level 2: Show progress and some debug information.

Level 3: Show all debug information.

The local information level also can be set using the -info keyword of the procedures in the RF extraction library.

# Syntax

lib::SetInfoDef 0 | 1 | 2 | 3

<table><tr><td>Argument</td><td>Description</td></tr><tr><td>&lt;info_level&gt;</td><td>Sets the default information level. Default: 0</td></tr></table>

# Returns

None.

# Example

lib::SetInfoDef 2

# References

[1] H. Hillbrand and P. H. Russer, “An Efficient Method for Computer Aided Noise Analysis of Linear Amplifier Networks,” IEEE Transactions on Circuits and Systems, vol. CAS-23. no. 4, pp. 235–238, 1976.   
[2] M. Reisch, High-Frequency Bipolar Transistors: Physics, Modeling, Applications, Berlin: Springer, 2003.   
[3] B. Razavi, Design of Analog CMOS Integrated Circuits, Boston: McGraw-Hill, 2001.   
[4] Sentaurus™ Device User Guide, Version T-2022.03, Mountain View, California: Synopsys, Inc., 2022.   
[5] R. S. Carson, High-Frequency Amplifiers, New York: John Wiley & Sons, 2nd ed., 1982.

[6] R. Ludwig and G. Bogdanov, RF Circuit Design: Theory and Applications, Upper Saddle River, New Jersey: Prentice Hall, 2nd ed., 2009.   
[7] W. Liu, Handbook of III-V Heterojunction Bipolar Transistors, New York: John Wiley & Sons, 1998.   
[8] M. S. Gupta, “Power Gain in Feedback Amplifiers, a Classic Revisited, IEEE Transactions on Microwave Theory and Techniques, vol. 40. no. 5, pp. 864–879, 1992.   
[9] J. D. Cressler and G. Niu, Silicon-Germanium Heterojunction Bipolar Transistors, Boston: Artech House, 2003.   
[10] A. M. Niknejad, Electromagnetics for High-Speed Analog and Digital Communication Circuits, Cambridge: Cambridge University Press, 2007.   
[11] G. Gonzalez, Microwave Transistor Amplifiers: Analysis and Design, Upper Saddle River, New Jersey: Prentice Hall, 2nd ed., 1997.   
[12] V. Rizzoli and A. Lipparini, “Computer-Aided Noise Analysis of Linear Multiport Networks of Arbitrary Topology,” IEEE Transactions on Microwave Theory and Techniques, vol. MTT-33. no. 12, pp. 1507–1512, 1985.   
[13] M. E. Mokari and W. Patience, “A New Method of Noise Parameter Calculation Using Direct Matrix Analysis,” IEEE Transactions on Circuits and Systems—I: Fundamental Theory and Applications, vol. 39. no. 9, pp. 767–771, 1992.   
[14] F. Bonani and G. Ghione, Noise in Semiconductor Devices, Modeling and Simulation, Berlin: Springer, 2001.

# IPhysicalConstants Library

This appendix provides information about the PhysicalConstants library.

# Major Physical Constants

This library defines a set of variables of major physical constants [1] (see Table 42). Table 42 Variables defined in PhysicalConstants library   

<table><tr><td>Name of variable</td><td>Value</td><td>Unit</td></tr><tr><td>AtomicMassConstant</td><td>1.660540210e-27</td><td>kg</td></tr><tr><td>AvogadroConstant</td><td>6.022136736e23</td><td>mol-1</td></tr><tr><td>BohrMagneton</td><td>9.274015431e-24</td><td>J/T</td></tr><tr><td>BoltzmannConstant</td><td>1.38065812e-23</td><td>J/K</td></tr><tr><td>ElectronMass</td><td>9.109389754e-31</td><td>kg</td></tr><tr><td>ElectronVolt</td><td>1.6021773349e-19</td><td>J</td></tr><tr><td>ElementaryCharge</td><td>1.6021773349e-19</td><td>C</td></tr><tr><td>FaradayConstant</td><td>9.648530929e4</td><td>C/mol</td></tr><tr><td>FineStructureConstant</td><td>7.2973530833e-3</td><td>1</td></tr><tr><td>FreeSpaceImpedance</td><td>376.730313462</td><td>Ω</td></tr><tr><td>GravitationConstant</td><td>6.6725985e-11</td><td>m3/kg/s2</td></tr><tr><td>MagneticFluxQuantum</td><td>2.0678346161e-15</td><td>Wb</td></tr><tr><td>MolarVolume</td><td>22.4141019e-3</td><td>m3/mol</td></tr><tr><td>Permeability</td><td>12.566370614e-7</td><td>H/m</td></tr><tr><td>Permittivity</td><td>8.854187817e-12</td><td>F/m</td></tr><tr><td>Pi</td><td>3.141592653589793</td><td>1</td></tr><tr><td>PlanckConstant</td><td>6.626075540e-34</td><td>Js</td></tr><tr><td>ProtonMass</td><td>1.672623110e-27</td><td>kg</td></tr><tr><td>RydbergConstant</td><td>1.097373153413e7</td><td>m-1</td></tr><tr><td>SpeedOfLight</td><td>299792458</td><td>m/s</td></tr><tr><td>StefanBoltzmannConstant</td><td>5.6705119e-8</td><td>W/m2/K4</td></tr><tr><td>kT300</td><td>0.0258521592446</td><td>V</td></tr></table>

To load the library, use the command:

load_library physicalconstants

The PhysicalConstants library uses a unique namespace identifier (const::) for its variables. All variables associated with this library are accessed with the namespace identifier prepended:

```txt
const::<var_name> 
```

For example:

load_library physicalconstants

puts " ${ \tt C } = \$ 5$ const::SpeedOfLight"

#-> c=299792458

The following conventions are used for the syntax of Tcl commands:

Angle brackets – <> – indicate text that must be replaced, but they are not part of the syntax.

# References

[1] G. Woan, The Cambridge Handbook of Physics Formulas, Cambridge: Cambridge University Press, 2000.