<template>
  <el-form ref="form" :model="user" :rules="rules" label-width="80px">
    <el-form-item label="旧密码" prop="oldPassword">
      <el-input v-model="user.oldPassword" placeholder="请输入旧密码" type="password" show-password/>
    </el-form-item>
    <el-form-item label="新密码" prop="newPassword">
      <el-input v-model="user.newPassword" placeholder="请输入新密码" type="password" show-password/>
    </el-form-item>
    <el-form-item label="确认密码" prop="confirmPassword">
      <el-input v-model="user.confirmPassword" placeholder="请确认新密码" type="password" show-password/>
    </el-form-item>
    <el-form-item>
      <el-button type="primary" size="mini" @click="submit">保存</el-button>
      <el-button type="danger" size="mini" @click="close">关闭</el-button>
    </el-form-item>
  </el-form>
</template>

<script>
import { updateUserPwd } from "@/api/system/user"
import store from '@/store'

const passwordRuleTip = '密码需为 8-20 位，至少包含大写字母、小写字母、数字、特殊字符中的三种，且不能包含账号名或常见弱密码'

export default {
  data() {
    const equalToPassword = (rule, value, callback) => {
      if (this.user.newPassword !== value) {
        callback(new Error("两次输入的密码不一致"))
      } else {
        callback()
      }
    }
    return {
      user: {
        oldPassword: undefined,
        newPassword: undefined,
        confirmPassword: undefined
      },
      // 表单校验
      rules: {
        oldPassword: [
          { required: true, message: "旧密码不能为空", trigger: "blur" }
        ],
        newPassword: [
          { required: true, message: "新密码不能为空", trigger: "blur" },
          { min: 8, max: 20, message: passwordRuleTip, trigger: "blur" },
          {
            validator: (rule, value, callback) => {
              if (!value) {
                callback()
                return
              }
              if (/[<>"'\\|]/.test(value)) {
                callback(new Error('不能包含非法字符：< > " \' \\ |'))
                return
              }
              const typeCount = [/[A-Z]/, /[a-z]/, /\d/, /[^A-Za-z0-9]/].filter(pattern => pattern.test(value)).length
              if (typeCount < 3) {
                callback(new Error(passwordRuleTip))
                return
              }
              const lowerValue = value.toLowerCase()
              const weakPasswords = ['12345678', '123456789', '1234567890', 'password', 'password123', 'admin123', 'admin123456', 'qwerty123', '11111111', '00000000', 'abc12345']
              if (weakPasswords.includes(lowerValue)) {
                callback(new Error(passwordRuleTip))
                return
              }
              callback()
            },
            trigger: 'blur'
          }
        ],
        confirmPassword: [
          { required: true, message: "确认密码不能为空", trigger: "blur" },
          { required: true, validator: equalToPassword, trigger: "blur" }
        ]
      }
    }
  },
  methods: {
    submit() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          updateUserPwd(this.user.oldPassword, this.user.newPassword).then(() => {
            store.dispatch('GetInfo').then(() => {
              this.$modal.msgSuccess("修改成功，请继续安全使用后台")
              this.user.oldPassword = undefined
              this.user.newPassword = undefined
              this.user.confirmPassword = undefined
            })
          })
        }
      })
    },
    close() {
      this.$tab.closePage()
    }
  }
}
</script>
