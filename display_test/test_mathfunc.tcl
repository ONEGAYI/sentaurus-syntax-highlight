# ============================================================
# Tcl 数学函数 + 新增核心命令 功能展示
# 在 VSCode 中打开此文件，检查高亮和悬停文档
# ============================================================

# --- 数学函数测试 (scope: support.function.math.tcl) ---

# 三角函数
set sin_val [expr {sin(0.5)}]
set cos_val [expr {cos(0.5)}]
set tan_val [expr {tan(0.5)}]
set asin_val [expr {asin(0.5)}]
set acos_val [expr {acos(0.5)}]
set atan_val [expr {atan(1.0)}]
set atan2_val [expr {atan2(1.0, 0.0)}]

# 双曲函数
set sinh_val [expr {sinh(1.0)}]
set cosh_val [expr {cosh(1.0)}]
set tanh_val [expr {tanh(1.0)}]

# 指数/对数
set exp_val [expr {exp(1.0)}]
set log_val [expr {log(2.718)}]
set log10_val [expr {log10(100.0)}]
set sqrt_val [expr {sqrt(16.0)}]
set pow_val [expr {pow(2.0, 10.0)}]

# 取整函数
set round_val [expr {round(3.5)}]
set ceil_val [expr {ceil(3.14)}]
set floor_val [expr {floor(3.14)}]
set int_val [expr {int(3.99)}]
set double_val [expr {double(42)}]
set entier_val [expr {entier(-3.99)}]
set wide_val [expr {wide(3.99)}]

# 其他
set abs_val [expr {abs(-42)}]
set hypot_val [expr {hypot(3.0, 4.0)}]
set fmod_val [expr {fmod(10.0, 3.0)}]
set bool_val [expr {bool(1)}]
set isqrt_val [expr {isqrt(20)}]

# 最值
set max_val [expr {max(3, 7, 2, 9)}]
set min_val [expr {min(3, 7, 2, 9)}]

# 随机数
expr {srand(42)}
set rand_val [expr {rand()}]

# --- 新增 Tcl 核心命令测试 ---

# 流程控制
proc test_control {x} {
    if {$x > 10} {
        return "large"
    } elseif {$x > 5} {
        return "medium"
    } else {
        return "small"
    }
}

for {set i 0} {$i < 3} {incr i} {
    puts "Step $i"
}

set items {1 2 3 4 5}
foreach item $items {
    if {$item == 2} { continue }
    if {$item == 4} { break }
    puts $item
}

set n 0
while {$n < 3} {
    incr n
}

switch "Newton" {
    "Newton"   { puts "Newton method" }
    "Explicit" { puts "Explicit scheme" }
    default    { puts "Unknown" }
}

# 事件循环 (仅声明，不实际执行)
# after 1000 {puts "delayed"}
# vwait done
# update

# 系统操作
set cwd [pwd]
# cd ..
# exec ls -la
# exit 0

# 计时
set timing [time {expr {sin(0.5)}} 1000]

# 列表进阶
set repeated [lrepeat 3 0.0]
set reversed [lreverse {1 2 3}]
set pair {1.2 0.8}
lassign $pair vg vd
set matrix {{0 0} {0 0}}
lset matrix 0 1 5
set doubled [lmap v {1 2 3} {expr {$v * 2}}]

puts "All tests passed"
