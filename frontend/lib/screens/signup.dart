import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Container(
          width: 360,
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey.shade300),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            spacing: 16,
            children: [
              const Text('Signup'),
              const TextField(
                autocorrect: false,
                decoration: InputDecoration(labelText: 'Email'),
              ),
              const TextField(
                autocorrect: false,
                decoration: InputDecoration(labelText: 'Password'),
                obscureText: true,
              ),
              const TextField(
                autocorrect: false,
                decoration: InputDecoration(labelText: 'Confirm Password'),
                obscureText: true,
              ),
              
              ElevatedButton(
                onPressed: () => context.go('/'),
                child: const Text('Entrar'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
