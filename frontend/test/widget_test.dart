import 'package:flutter_test/flutter_test.dart';

import 'package:frontend/main.dart';

void main() {
  testWidgets('Login navega para Home', (WidgetTester tester) async {
    await tester.pumpWidget(const MyApp());

    expect(find.text('Login Screen'), findsOneWidget);

    await tester.tap(find.text('Entrar'));
    await tester.pumpAndSettle();

    expect(find.text('Home'), findsOneWidget);
  });
}
