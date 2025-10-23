# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - generic [ref=e6]:
      - link "DEBATE APP" [ref=e7] [cursor=pointer]:
        - /url: /
        - generic [ref=e8]: DEBATE APP
      - navigation [ref=e9]:
        - link "Home" [ref=e10] [cursor=pointer]:
          - /url: /
        - link "Browse Debates" [ref=e11] [cursor=pointer]:
          - /url: /browse
        - link "Login" [ref=e12] [cursor=pointer]:
          - /url: /login
        - link "Sign Up" [ref=e13] [cursor=pointer]:
          - /url: /signup
  - generic [ref=e15]:
    - generic [ref=e16]:
      - heading "Sign in to your account" [level=2] [ref=e17]
      - paragraph [ref=e18]:
        - text: Or
        - link "create a new account" [ref=e19] [cursor=pointer]:
          - /url: /signup
    - generic [ref=e20]:
      - generic [ref=e21]:
        - generic [ref=e22]:
          - generic [ref=e23]: Email address
          - textbox "Email address" [ref=e24]: invalid@test.com
        - generic [ref=e25]:
          - generic [ref=e26]: Password
          - textbox "Password" [active] [ref=e27]: wrongpassword
      - button "Sign in" [ref=e29] [cursor=pointer]
    - generic [ref=e30]:
      - generic [ref=e33]: Or continue with
      - button "Sign in with Google" [ref=e35] [cursor=pointer]:
        - img [ref=e36]
        - text: Sign in with Google
```