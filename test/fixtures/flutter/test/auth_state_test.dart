// Sample LLM-generated trivial test — pattern surveyed in Ai-Interior-Design.
// All assertions are on a freshly-constructed value object's fields.
import 'package:flutter_test/flutter_test.dart';

class AuthState {
  final bool isLoading;
  final String? error;
  const AuthState({this.isLoading = false, this.error});
}

void main() {
  test('should have default values', () {
    const state = AuthState();
    expect(state.isLoading, false);
    expect(state.error, null);
  });

  test('should create state with custom values', () {
    const state = AuthState(isLoading: true, error: 'Test error');
    expect(state.isLoading, true);
    expect(state.error, 'Test error');
  });
}
